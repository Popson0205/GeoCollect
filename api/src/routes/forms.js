// api/src/routes/forms.js
const pool = require('../db/pool');
const { randomUUID } = require('crypto');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalise a form row so consumers always get `geofences` as an array.
 * Legacy rows that only have the old `geofence` column are promoted on read.
 */
function normaliseForm(row) {
  // If the new geofences array is empty but the legacy single geofence exists,
  // promote it so old data is never invisible.
  if (
    row.geofences &&
    Array.isArray(row.geofences) &&
    row.geofences.length === 0 &&
    row.geofence
  ) {
    row.geofences = [{ id: 'legacy', name: 'Zone 1', polygon: row.geofence }];
  }
  return row;
}

// ── Routes ────────────────────────────────────────────────────────────────────

module.exports = async function (fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  // ── GET /projects/:projectId/forms ──────────────────────────────────────────
  fastify.get('/projects/:projectId/forms', auth, async (req) => {
    const { rows } = await pool.query(
      `SELECT id, project_id, name, version, geometry_type, schema,
              geofence, geofences, is_published,
              share_token, visibility,
              created_by, created_at, updated_at
       FROM form_schemas
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [req.params.projectId]
    );
    return rows.map(normaliseForm);
  });

  // ── POST /projects/:projectId/forms ─────────────────────────────────────────
  fastify.post('/projects/:projectId/forms', auth, async (req, reply) => {
    const {
      name,
      geometry_type = 'Point',
      schema = {},
      geofence = null,       // legacy single zone (still accepted)
      geofences = [],        // new: array of { id, name, polygon }
      visibility = 'private',
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO form_schemas
         (project_id, name, geometry_type, schema,
          geofence, geofences, visibility, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.params.projectId,
        name,
        geometry_type,
        JSON.stringify(schema),
        geofence ? JSON.stringify(geofence) : null,
        JSON.stringify(geofences),
        visibility,
        req.user.id,
      ]
    );
    return reply.code(201).send(normaliseForm(rows[0]));
  });

  // ── GET /forms/:id ──────────────────────────────────────────────────────────
  fastify.get('/forms/:id', auth, async (req, reply) => {
    const { rows } = await pool.query(
      `SELECT id, project_id, name, version, geometry_type, schema,
              geofence, geofences, is_published,
              share_token, visibility,
              created_by, created_at, updated_at
       FROM form_schemas WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return normaliseForm(rows[0]);
  });

  // ── PATCH /forms/:id ────────────────────────────────────────────────────────
  // Accepts: name, geometry_type, schema, geofence, geofences, visibility
  fastify.patch('/forms/:id', auth, async (req, reply) => {
    const { name, geometry_type, schema, geofence, geofences, visibility } = req.body;

    const sets = [];
    const params = [];

    if (name !== undefined) {
      params.push(name); sets.push(`name = $${params.length}`);
    }
    if (geometry_type !== undefined) {
      params.push(geometry_type); sets.push(`geometry_type = $${params.length}`);
    }
    if (schema !== undefined) {
      params.push(JSON.stringify(schema)); sets.push(`schema = $${params.length}::jsonb`);
    }
    if (visibility !== undefined) {
      params.push(visibility); sets.push(`visibility = $${params.length}`);
    }
    // Legacy single geofence
    if ('geofence' in req.body) {
      params.push(geofence ? JSON.stringify(geofence) : null);
      sets.push(`geofence = $${params.length}`);
    }
    // New multi-zone array
    if ('geofences' in req.body) {
      params.push(JSON.stringify(geofences ?? []));
      sets.push(`geofences = $${params.length}::jsonb`);
    }

    if (sets.length === 0) {
      const { rows } = await pool.query('SELECT * FROM form_schemas WHERE id = $1', [req.params.id]);
      if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
      return normaliseForm(rows[0]);
    }

    sets.push('updated_at = NOW()');
    params.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE form_schemas SET ${sets.join(', ')}
       WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return normaliseForm(rows[0]);
  });

  // ── POST /forms/:id/publish ─────────────────────────────────────────────────
  // Generates a share_token on first publish (idempotent on re-publish).
  // Accepts optional `visibility` in body to set/change on publish.
  fastify.post('/forms/:id/publish', auth, async (req, reply) => {
    const visibility = req.body?.visibility;

    const sets = [
      'is_published = TRUE',
      'version = version + 1',
      'updated_at = NOW()',
      // Generate token only if not already set
      `share_token = COALESCE(share_token, $1)`,
    ];
    const params = [randomUUID(), req.params.id];

    if (visibility) {
      params.splice(1, 0, visibility); // insert before id
      sets.push(`visibility = $2`);
      // shift id param index
      params.push(params.splice(1, 1)[0]); // move id back to last
    }

    // Cleaner approach — build explicitly:
    const token = randomUUID();
    let query;
    let qParams;

    if (visibility) {
      query = `
        UPDATE form_schemas
        SET is_published = TRUE,
            version      = version + 1,
            updated_at   = NOW(),
            share_token  = COALESCE(share_token, $1),
            visibility   = $2
        WHERE id = $3
        RETURNING *`;
      qParams = [token, visibility, req.params.id];
    } else {
      query = `
        UPDATE form_schemas
        SET is_published = TRUE,
            version      = version + 1,
            updated_at   = NOW(),
            share_token  = COALESCE(share_token, $1)
        WHERE id = $2
        RETURNING *`;
      qParams = [token, req.params.id];
    }

    const { rows } = await pool.query(query, qParams);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return normaliseForm(rows[0]);
  });

  // ── GET /forms/share/:token  (PUBLIC — no auth) ─────────────────────────────
  // Used by the Field app's public collect page.
  // Returns form schema + geofences. Does NOT expose internal IDs beyond
  // what the field collector needs.
  fastify.get('/forms/share/:token', async (req, reply) => {
    const { rows } = await pool.query(
      `SELECT id, project_id, name, geometry_type, schema,
              geofence, geofences, visibility
       FROM form_schemas
       WHERE share_token = $1
         AND is_published = TRUE`,
      [req.params.token]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Form not found or not published' });

    const form = normaliseForm(rows[0]);

    // Private forms cannot be accessed via share link at all
    if (form.visibility === 'private') {
      return reply.code(403).send({ error: 'This form is private and cannot be accessed via share link.' });
    }

    return form;
  });

  // ── DELETE /forms/:id ───────────────────────────────────────────────────────
  fastify.delete('/forms/:id', auth, async (req, reply) => {
    await pool.query('DELETE FROM form_schemas WHERE id = $1', [req.params.id]);
    return reply.code(204).send();
  });
};
