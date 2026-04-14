// api/src/routes/forms.js
const pool = require('../db/pool');

module.exports = async function (fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  // ── GET /projects/:projectId/forms ──────────────────────────────────────────
  // Returns geofence so the field app can cache it offline
  fastify.get('/projects/:projectId/forms', auth, async (req) => {
    const { rows } = await pool.query(
      `SELECT id, project_id, name, version, geometry_type, schema,
              geofence, is_published, created_by, created_at, updated_at
       FROM form_schemas
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [req.params.projectId]
    );
    return rows;
  });

  // ── POST /projects/:projectId/forms ─────────────────────────────────────────
  fastify.post('/projects/:projectId/forms', auth, async (req, reply) => {
    const { name, geometry_type = 'Point', schema = {}, geofence = null } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO form_schemas
         (project_id, name, geometry_type, schema, geofence, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.params.projectId,
        name,
        geometry_type,
        JSON.stringify(schema),
        geofence ? JSON.stringify(geofence) : null,
        req.user.id,
      ]
    );
    return reply.code(201).send(rows[0]);
  });

  // ── GET /forms/:id ──────────────────────────────────────────────────────────
  fastify.get('/forms/:id', auth, async (req, reply) => {
    const { rows } = await pool.query(
      `SELECT id, project_id, name, version, geometry_type, schema,
              geofence, is_published, created_by, created_at, updated_at
       FROM form_schemas
       WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // ── PATCH /forms/:id ────────────────────────────────────────────────────────
  // Accepts: name, geometry_type, schema, geofence
  // geofence can be a GeoJSON Polygon object or null (to clear it)
  fastify.patch('/forms/:id', auth, async (req, reply) => {
    const { name, geometry_type, schema, geofence } = req.body;

    // Build dynamic SET clause so we only touch fields that were sent
    const sets = [];
    const params = [];

    if (name !== undefined) {
      params.push(name);
      sets.push(`name = $${params.length}`);
    }
    if (geometry_type !== undefined) {
      params.push(geometry_type);
      sets.push(`geometry_type = $${params.length}`);
    }
    if (schema !== undefined) {
      params.push(JSON.stringify(schema));
      sets.push(`schema = $${params.length}::jsonb`);
    }
    // geofence: explicit null clears it; omitting the key leaves it unchanged
    if ('geofence' in req.body) {
      params.push(geofence ? JSON.stringify(geofence) : null);
      sets.push(`geofence = $${params.length}`);
    }

    if (sets.length === 0) {
      // Nothing to update — just return current record
      const { rows } = await pool.query(
        'SELECT * FROM form_schemas WHERE id = $1',
        [req.params.id]
      );
      if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
      return rows[0];
    }

    sets.push('updated_at = NOW()');
    params.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE form_schemas SET ${sets.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // ── POST /forms/:id/publish ─────────────────────────────────────────────────
  fastify.post('/forms/:id/publish', auth, async (req, reply) => {
    const { rows } = await pool.query(
      `UPDATE form_schemas
       SET is_published = TRUE, version = version + 1, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // ── DELETE /forms/:id ───────────────────────────────────────────────────────
  fastify.delete('/forms/:id', auth, async (req, reply) => {
    await pool.query('DELETE FROM form_schemas WHERE id = $1', [req.params.id]);
    return reply.code(204).send();
  });
};
