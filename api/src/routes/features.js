const pool = require('../db/pool');

module.exports = async function (fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  // POST /features — submit a feature
  fastify.post('/features', auth, async (req, reply) => {
    const { form_schema_id, project_id, geometry, attributes, device_id } = req.body;
    // geometry should be GeoJSON geometry object
    const geomWKT = `ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)`;
    const { rows } = await pool.query(
      `INSERT INTO features (form_schema_id, project_id, submitted_by, geometry, attributes, device_id)
       VALUES ($2, $3, $4, ${geomWKT}, $5, $6) RETURNING id, form_schema_id, project_id, attributes, device_id, submitted_at`,
      [JSON.stringify(geometry), form_schema_id, project_id, req.user.id, JSON.stringify(attributes), device_id]
    );
    return reply.code(201).send(rows[0]);
  });

  // POST /features/batch — bulk sync from offline device
  fastify.post('/features/batch', auth, async (req, reply) => {
    const { features } = req.body;
    const client = await pool.connect();
    const results = [];
    try {
      await client.query('BEGIN');
      for (const f of features) {
        const { form_schema_id, project_id, geometry, attributes, device_id } = f;
        const { rows } = await client.query(
          `INSERT INTO features (form_schema_id, project_id, submitted_by, geometry, attributes, device_id)
           VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5, $6)
           RETURNING id, submitted_at`,
          [form_schema_id, project_id, req.user.id, JSON.stringify(geometry), JSON.stringify(attributes), device_id]
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
    return reply.code(201).send({ synced: results.length, results });
  });

  // GET /projects/:projectId/features — list with GeoJSON output
  fastify.get('/projects/:projectId/features', auth, async (req) => {
    const { form_id, limit = 1000, offset = 0 } = req.query;
    let query = `
      SELECT f.id, f.form_schema_id, f.attributes, f.device_id, f.submitted_at,
             ST_AsGeoJSON(f.geometry)::jsonb as geometry,
             u.full_name as submitted_by_name
      FROM features f
      LEFT JOIN users u ON u.id = f.submitted_by
      WHERE f.project_id=$1
    `;
    const params = [req.params.projectId];
    if (form_id) { params.push(form_id); query += ` AND f.form_schema_id=$${params.length}`; }
    query += ` ORDER BY f.submitted_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);
    const { rows } = await pool.query(query, params);
    // Return as GeoJSON FeatureCollection
    return {
      type: 'FeatureCollection',
      features: rows.map(r => ({
        type: 'Feature',
        id: r.id,
        geometry: r.geometry,
        properties: { ...r.attributes, _submitted_at: r.submitted_at, _submitted_by: r.submitted_by_name, _form_id: r.form_schema_id }
      }))
    };
  });

  // GET /features/:id
  fastify.get('/features/:id', auth, async (req, reply) => {
    const { rows } = await pool.query(
      `SELECT f.*, ST_AsGeoJSON(f.geometry)::jsonb as geometry, u.full_name as submitted_by_name
       FROM features f LEFT JOIN users u ON u.id=f.submitted_by WHERE f.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return {
      type: 'Feature',
      id: rows[0].id,
      geometry: rows[0].geometry,
      properties: { ...rows[0].attributes, _submitted_at: rows[0].submitted_at }
    };
  });

  // DELETE /features/:id
  fastify.delete('/features/:id', auth, async (req, reply) => {
    await pool.query('DELETE FROM features WHERE id=$1', [req.params.id]);
    return reply.code(204).send();
  });
};
