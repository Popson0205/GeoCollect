// api/src/db/migrate.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = `
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'field_collector'
      CHECK (role IN ('field_collector','project_manager','gis_analyst','platform_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'field_collector'
      CHECK (role IN ('field_collector','project_manager','gis_analyst','platform_admin')),
    PRIMARY KEY (project_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS form_schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    geometry_type TEXT NOT NULL DEFAULT 'Point'
      CHECK (geometry_type IN ('Point','LineString','Polygon','Multi')),
    schema JSONB NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Geofence boundary: GeoJSON Polygon stored as JSONB.
  -- Added in migration v2 — safe to run multiple times.
  ALTER TABLE form_schemas
    ADD COLUMN IF NOT EXISTS geofence JSONB DEFAULT NULL;

  CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_schema_id UUID REFERENCES form_schemas(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    geometry GEOMETRY NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced','pending','conflict')),
    device_id TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS features_geometry_idx ON features USING GIST (geometry);
  CREATE INDEX IF NOT EXISTS features_project_idx ON features (project_id);
  CREATE INDEX IF NOT EXISTS features_form_idx ON features (form_schema_id);

  CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    field_key TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(migrations);
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
