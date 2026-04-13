const pool = require('../db/pool');

module.exports = async function (fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  // GET /projects/:projectId/forms
  fastify.get('/projects/:projectId/forms', auth, async (req) => {
    const { rows } = await pool.query(
      'SELECT * FROM form_schemas WHERE project_id=$1 ORDER BY created_at DESC',
      [req.params.projectId]
    );
    return rows;
  });

  // POST /projects/:projectId/forms
  fastify.post('/projects/:projectId/forms', auth, async (req, reply) => {
    const { name, geometry_type = 'Point', schema = {} } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO form_schemas (project_id, name, geometry_type, schema, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.projectId, name, geometry_type, JSON.stringify(schema), req.user.id]
    );
    return reply.code(201).send(rows[0]);
  });

  // GET /forms/:id
  fastify.get('/forms/:id', auth, async (req, reply) => {
    const { rows } = await pool.query('SELECT * FROM form_schemas WHERE id=$1', [req.params.id]);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // PATCH /forms/:id
  fastify.patch('/forms/:id', auth, async (req, reply) => {
    const { name, geometry_type, schema } = req.body;
    const { rows } = await pool.query(
      `UPDATE form_schemas 
       SET name=COALESCE($1,name), geometry_type=COALESCE($2,geometry_type),
           schema=COALESCE($3::jsonb,schema), updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [name, geometry_type, schema ? JSON.stringify(schema) : null, req.params.id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // POST /forms/:id/publish
  fastify.post('/forms/:id/publish', auth, async (req, reply) => {
    const { rows } = await pool.query(
      'UPDATE form_schemas SET is_published=TRUE, version=version+1, updated_at=NOW() WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // DELETE /forms/:id
  fastify.delete('/forms/:id', auth, async (req, reply) => {
    await pool.query('DELETE FROM form_schemas WHERE id=$1', [req.params.id]);
    return reply.code(204).send();
  });
};
