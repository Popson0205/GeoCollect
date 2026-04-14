require('dotenv').config();
const Fastify = require('fastify');

const app = Fastify({ logger: true });

// Plugins
app.register(require('@fastify/cors'), { origin: '*' });
app.register(require('./plugins/jwt'));
app.register(require('@fastify/multipart'));

// Health
app.get('/health', async () => ({ status: 'ok', service: 'geocollect-api', ts: new Date().toISOString() }));

// Routes
app.register(require('./routes/auth'));
app.register(require('./routes/projects'));
app.register(require('./routes/forms'));
app.register(require('./routes/features'));

const PORT = process.env.PORT || 3001;
app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
  console.log(`GeoCollect API running on :${PORT}`);
});
