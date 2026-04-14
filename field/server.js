// field/server.js
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app  = express();
const PORT = process.env.PORT || 3003;
const __dir = dirname(fileURLToPath(import.meta.url));
const DIST  = join(__dir, "dist");

// Static assets — long-lived cache for hashed filenames
app.use(express.static(DIST, { maxAge: "1y", immutable: true, index: false }));

// SPA fallback — all routes serve index.html
app.get("*", (_req, res) => res.sendFile(join(DIST, "index.html")));

app.listen(PORT, "0.0.0.0", () =>
  console.log(`GeoCollect Field listening on port ${PORT}`)
);
