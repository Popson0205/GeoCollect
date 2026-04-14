// field/server.js
// Minimal static server for Render deployment.
// Binds immediately on $PORT — no serve cold-start timeout.
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app  = express();
const PORT = process.env.PORT || 3003;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "dist");

// Serve static assets with long-lived cache
app.use(express.static(DIST, { maxAge: "1y", immutable: true, index: false }));

// SPA fallback — all routes serve index.html
app.get("*", (_req, res) => {
  res.sendFile(join(DIST, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`GeoCollect Field listening on port ${PORT}`);
});
