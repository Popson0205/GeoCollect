// api/src/index.js
// GeoCollect API — entry point.
//
// REPLACE existing api/src/index.js with this file.
// Phase 3 additions:
//   - apiKeyAuth plugin registered (API key + authenticateAny decorators)
//   - portal routes registered (/portal/*)
//   - @fastify/rate-limit registered (used by public share endpoint)

require('dotenv').config();
const Fastify = require('fastify');

const app = Fastify({ logger: true });

// ── Plugins ───────────────────────────────────────────────────────────────────
app.register(require('@fastify/cors'), { origin: '*' });
app.register(require('./plugins/jwt'));
app.register(require('@fastify/multipart'));

// Phase 3: API key auth + rate limiting
app.register(require('./plugins/apiKeyAuth'));
app.register(require('@fastify/rate-limit'), {
  global: false,          // only applied where explicitly used
  max: 60,
  timeWindow: '1 minute',
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok',
  service: 'geocollect-api',
  ts: new Date().toISOString(),
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.register(require('./routes/auth'));
app.register(require('./routes/projects'));
app.register(require('./routes/forms'));
app.register(require('./routes/features'));
app.register(require('./routes/attachments'));  // Phase 2: media attachments
app.register(require('./routes/portal'));        // Phase 3: portal, API keys, webhooks, exports

// ── WebSocket (Yjs CRDT sync) ─────────────────────────────────────────────────
require('./ws-server')(app);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
  console.log(`GeoCollect API running on :${PORT}`);
});
