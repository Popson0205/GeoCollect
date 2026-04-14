// api/src/routes/features.js
const pool = require('../db/pool');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Check whether a GeoJSON geometry falls within ANY of the form's geofence
 * zones. If no zones are configured the submission is always allowed.
 *
 * Priority: new `geofences` array → legacy `geofence` column.
 * Uses PostGIS ST_Within for spatial accuracy.
 *
 * Returns { allowed: true } or { allowed: false, error: string }.
 */
async function checkGeofence(client, formSchemaId, geometry) {
  const { rows } = await client.query(
    'SELECT geofence, geofences, visibility FROM form_schemas WHERE id = $1',
    [formSchemaId]
  );
  if (!rows[0]) return { allowed: true }; // form not found — let DB FK handle it

  const { geofence, geofences, visibility } = rows[0];

  // Build the list of zones to test
  const zones = [];

  if (Array.isArray(geofences) && geofences.length > 0) {
    zones.push(...geofences.map((z) => z.polygon));
  } else if (geofence) {
    zones.push(geofence);
  }

  // No zones configured → allow
  if (zones.length === 0) return { allowed: true, visibility };

  // Test each zone — pass if inside ANY one
  for (const polygon of zones) {
    const result = await client.query(
      `SELECT ST_Within(
         ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
         ST_SetSRID(ST_GeomFromGeoJSON($2), 4326)
       ) AS within`,
      [JSON.stringify(geometry), JSON.stringify(polygon)]
    );
    if (result.rows[0]?.within) return { allowed: true, visibility };
  }

  return {
    allowed: false,
    visibility,
    error: 'Submission rejected: location is outside all geofence zones for this form.',
  };
}

/**
 * Check whether a user (by id) is a member of the project that owns a form.
 * Used for `organization` visibility enforcement.
 */
async function isOrgMember(client, formSchemaId, userId) {
  const { rows } = await client.query(
    `SELECT 1 FROM project_members pm
     JOIN form_schemas fs ON fs.project_id = pm.project_id
     WHERE fs.id = $1 AND pm.user_id = $2
     LIMIT 1`,
    [formSchemaId, userId]
  );
  return rows.length > 0;
}

// ── Routes ────────────────────────────────────────────────────────────────────

module.exports = async function (fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  // ── POST /features  (authenticated) ─────────────────────────────────────────
  fastify.post('/features', auth, async (req, reply) => {
    const { form_schema_id, project_id, geometry, attributes, device_id } = req.body;

    const client = await pool.connect();
    try {
      const fence = await checkGeofence(client, form_schema_id, geometry);
      if (!fence.allowed) return reply.code(422).send({ error: fence.error });

      // Organization visibility: user must be a project member
      if (fence.visibility === 'organization') {
        const member = await isOrgMember(client, form_schema_id, req.user.id);
        if (!member) {
          return reply.code(403).send({
            error: 'This form is restricted to organization members.',
          });
        }
      }

      const { rows } = await client.query(
        `INSERT INTO features
           (form_schema_id, project_id, submitted_by, geometry, attributes, device_id)
         VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5, $6)
         RETURNING id, form_schema_id, project_id, attributes, device_id, submitted_at`,
        [
          form_schema_id, project_id, req.user.id,
          JSON.stringify(geometry), JSON.stringify(attributes), device_id,
        ]
      );
      return reply.code(201).send(rows[0]);
    } finally {
      client.release();
    }
  });

  // ── POST /features/public  (NO auth — public share link submissions) ─────────
  // Only allowed when form visibility = 'public'.
  // submitted_by is recorded as NULL.
  fastify.post('/features/public', async (req, reply) => {
    const { share_token, form_schema_id, project_id, geometry, attributes, device_id } = req.body;

    // Resolve form via share_token (more tamper-resistant than trusting form_schema_id alone)
    const { rows: formRows } = await pool.query(
      `SELECT id, project_id, visibility
       FROM form_schemas
       WHERE share_token = $1 AND is_published = TRUE`,
      [share_token]
    );
    if (!formRows[0]) {
      return reply.code(404).send({ error: 'Form not found or not published.' });
    }

    const form = formRows[0];

    if (form.visibility !== 'public') {
      return reply.code(403).send({
        error: form.visibility === 'private'
          ? 'This form is private. Submissions are not accepted via share link.'
          : 'This form is restricted to organization members. Please log in.',
      });
    }

    const client = await pool.connect();
    try {
      const fence = await checkGeofence(client, form.id, geometry);
      if (!fence.allowed) return reply.code(422).send({ error: fence.error });

      const { rows } = await client.query(
        `INSERT INTO features
           (form_schema_id, project_id, submitted_by, geometry, attributes, device_id)
         VALUES ($1, $2, NULL, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), $4, $5)
         RETURNING id, form_schema_id, project_id, attributes, device_id, submitted_at`,
        [
          form.id, form.project_id,
          JSON.stringify(geometry), JSON.stringify(attributes), device_id,
        ]
      );
      return reply.code(201).send(rows[0]);
    } finally {
      client.release();
    }
  });

  // ── POST /features/batch  (authenticated offline sync) ──────────────────────
  fastify.post('/features/batch', auth, async (req, reply) => {
    const { features } = req.body;
    const client = await pool.connect();
    const results = [];
    const skipped = [];

    try {
      await client.query('BEGIN');

      for (const f of features) {
        const { form_schema_id, project_id, geometry, attributes, device_id } = f;

        const fence = await checkGeofence(client, form_schema_id, geometry);
        if (!fence.allowed) {
          skipped.push({ id: f.id, reason: fence.error }); continue;
        }

        // Organization check for batch sync
        if (fence.visibility === 'organization') {
          const member = await isOrgMember(client, form_schema_id, req.user.id);
          if (!member) {
            skipped.push({ id: f.id, reason: 'Not an organization member.' }); continue;
          }
        }

        const { rows } = await client.query(
          `INSERT INTO features
             (form_schema_id, project_id, submitted_by, geometry, attributes, device_id)
           VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5, $6)
           RETURNING id, submitted_at`,
          [
            form_schema_id, project_id, req.user.id,
            JSON.stringify(geometry), JSON.stringify(attributes), device_id,
          ]
        );
        results.push(rows[0]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return reply.code(201).send({ synced: results.length, results, skipped });
  });

  // ── GET /projects/:projectId/features ───────────────────────────────────────
  fastify.get('/projects/:projectId/features', auth, async (req) => {
    const { form_id, limit = 1000, offset = 0 } = req.query;
    let query = `
      SELECT f.id, f.form_schema_id, f.attributes, f.device_id, f.submitted_at,
             ST_AsGeoJSON(f.geometry)::jsonb AS geometry,
             u.full_name AS submitted_by_name
      FROM features f
      LEFT JOIN users u ON u.id = f.submitted_by
      WHERE f.project_id = $1
    `;
    const params = [req.params.projectId];
    if (form_id) {
      params.push(form_id);
      query += ` AND f.form_schema_id = $${params.length}`;
    }
    query += ` ORDER BY f.submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return {
      type: 'FeatureCollection',
      features: rows.map((r) => ({
        type: 'Feature',
        id: r.id,
        geometry: r.geometry,
        properties: {
          ...r.attributes,
          _submitted_at: r.submitted_at,
          _submitted_by: r.submitted_by_name,
          _form_id: r.form_schema_id,
        },
      })),
    };
  });

  // ── GET /features/:id ───────────────────────────────────────────────────────
  fastify.get('/features/:id', auth, async (req, reply) => {
    const { rows } = await pool.query(
      `SELECT f.*, ST_AsGeoJSON(f.geometry)::jsonb AS geometry,
              u.full_name AS submitted_by_name
       FROM features f
       LEFT JOIN users u ON u.id = f.submitted_by
       WHERE f.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return {
      type: 'Feature',
      id: rows[0].id,
      geometry: rows[0].geometry,
      properties: {
        ...rows[0].attributes,
        _submitted_at: rows[0].submitted_at,
      },
    };
  });

  // ── DELETE /features/:id ────────────────────────────────────────────────────
  fastify.delete('/features/:id', auth, async (req, reply) => {
    await pool.query('DELETE FROM features WHERE id = $1', [req.params.id]);
    return reply.code(204).send();
  });
};
