// api/src/routes/features.js
const pool = require('../db/pool');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check whether a GeoJSON geometry falls within a form's geofence (if set).
 * Uses PostGIS ST_Within so the check is spatially correct.
 * Returns { allowed: true } or { allowed: false, error: string }.
 */
async function checkGeofence(client, formSchemaId, geometry) {
  // Fetch the form's geofence
  const { rows } = await client.query(
    'SELECT geofence FROM form_schemas WHERE id = $1',
    [formSchemaId]
  );

  // No form found or no geofence set → allow
  if (!rows[0] || !rows[0].geofence) return { allowed: true };

  const geofence = rows[0].geofence;

  // Use PostGIS to test containment
  const result = await client.query(
    `SELECT ST_Within(
       ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
       ST_SetSRID(ST_GeomFromGeoJSON($2), 4326)
     ) AS within`,
    [JSON.stringify(geometry), JSON.stringify(geofence)]
  );

  if (!result.rows[0]?.within) {
    return {
      allowed: false,
      error: 'Submission rejected: location is outside the form\'s geofence boundary.',
    };
  }

  return { allowed: true };
}

// ── Routes ───────────────────────────────────────────────────────────────────

module.exports = async function (fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  // ── POST /features ──────────────────────────────────────────────────────────
  fastify.post('/features', auth, async (req, reply) => {
    const { form_schema_id, project_id, geometry, attributes, device_id } = req.body;

    const client = await pool.connect();
    try {
      // Geofence check
      const fence = await checkGeofence(client, form_schema_id, geometry);
      if (!fence.allowed) {
        return reply.code(422).send({ error: fence.error });
      }

      const { rows } = await client.query(
        `INSERT INTO features
           (form_schema_id, project_id, submitted_by, geometry, attributes, device_id)
         VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5, $6)
         RETURNING id, form_schema_id, project_id, attributes, device_id, submitted_at`,
        [
          form_schema_id,
          project_id,
          req.user.id,
          JSON.stringify(geometry),
          JSON.stringify(attributes),
          device_id,
        ]
      );
      return reply.code(201).send(rows[0]);
    } finally {
      client.release();
    }
  });

  // ── POST /features/batch ────────────────────────────────────────────────────
  // Offline sync endpoint. Each feature is checked individually.
  // Features outside the geofence are skipped (not rejected wholesale)
  // so a mixed batch doesn't fail entirely — caller gets per-feature results.
  fastify.post('/features/batch', auth, async (req, reply) => {
    const { features } = req.body;
    const client = await pool.connect();
    const results = [];
    const skipped = [];

    try {
      await client.query('BEGIN');

      for (const f of features) {
        const { form_schema_id, project_id, geometry, attributes, device_id } = f;

        // Per-feature geofence check
        const fence = await checkGeofence(client, form_schema_id, geometry);
        if (!fence.allowed) {
          skipped.push({ id: f.id, reason: fence.error });
          continue;
        }

        const { rows } = await client.query(
          `INSERT INTO features
             (form_schema_id, project_id, submitted_by, geometry, attributes, device_id)
           VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5, $6)
           RETURNING id, submitted_at`,
          [
            form_schema_id,
            project_id,
            req.user.id,
            JSON.stringify(geometry),
            JSON.stringify(attributes),
            device_id,
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

    return reply.code(201).send({
      synced: results.length,
      results,
      skipped,
    });
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
