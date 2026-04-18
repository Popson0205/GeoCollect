# GeoCollect — Phase 1

Open-architecture geospatial data collection platform. Alternative to ArcGIS Survey123 & FieldMaps.

## Components

| Service | Port | Description |
|---|---|---|
| `api` | 3001 | Fastify REST API (auth, projects, forms, features) |
| `geo-api` | 3002 | FastAPI geospatial service (validation, export, GeoServer) |
| `studio` | 3000 | Next.js form designer & project management portal |
| `field` | 3003 | React PWA data collection app (offline-capable) |
| `postgres` | 5432 | PostgreSQL 16 + PostGIS 3.4 |
| `redis` | 6379 | Redis (async job queue) |
| `minio` | 9000/9001 | S3-compatible object storage |
| `geoserver` | 8080 | GeoServer WMS/WFS/OGC API |

---

## Quick Start (Local — Docker Compose)

### Prerequisites
- Docker Desktop 4.x+ (or Docker Engine + Compose plugin)
- 8 GB RAM minimum recommended

### 1. Clone & configure
```bash
cp .env.example .env
# Edit .env — at minimum change JWT_SECRET
```

### 2. Start all services
```bash
docker compose up --build
```

First build takes ~5–10 minutes (downloads base images, installs dependencies).

### 3. Access the apps

| App | URL |
|---|---|
| Studio (form designer) | http://localhost:3000 |
| Field (data collection) | http://localhost:3003 |
| API docs | http://localhost:3001/documentation |
| Geo API docs | http://localhost:3002/docs |
| GeoServer | http://localhost:8080/geoserver |
| MinIO console | http://localhost:9001 |

### 4. Create your first admin account

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@geocollect.io","password":"password123","full_name":"Admin User","role":"platform_admin"}'
```

### 5. Initialise GeoServer workspace

```bash
curl -X POST http://localhost:3002/geoserver/workspace/init
```

---

## Deploy to Render

### Managed services (Postgres + Redis)
Render provides managed Postgres and Redis — no configuration needed, just deploy.

### App services
```bash
# Connect your repo to Render, then:
render blueprint apply render.yaml
```

### GeoServer + MinIO on Render
GeoServer and MinIO require persistent storage. Options:
1. **Render Private Service** — deploy `kartoza/geoserver` as a private Docker service
2. **External VPS** — run GeoServer + MinIO on a DigitalOcean/Hetzner droplet and point `GEOSERVER_URL` and `MINIO_ENDPOINT` env vars at it

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GeoCollect Platform                     │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │   Field PWA  │   │    Studio    │   │   Any GIS client │   │
│  │  (port 3003) │   │  (port 3000) │   │  QGIS/ArcGIS Pro│   │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘   │
│         │                  │                     │             │
│         └──────────────────┼─────────────────────┘             │
│                            │                                   │
│                   ┌────────▼────────┐                          │
│                   │  Fastify API    │  JWT Auth                │
│                   │   (port 3001)   │  RBAC (4 roles)         │
│                   └────────┬────────┘                          │
│                            │                                   │
│              ┌─────────────┼─────────────┐                    │
│              │             │             │                     │
│     ┌────────▼──┐  ┌───────▼────┐  ┌────▼──────┐             │
│     │ PostgreSQL│  │  FastAPI   │  │   Redis   │             │
│     │ + PostGIS │  │  Geo API   │  │  + BullMQ │             │
│     └────────┬──┘  └───────┬────┘  └───────────┘             │
│              │             │                                   │
│     ┌────────▼──┐  ┌───────▼────┐                            │
│     │ GeoServer │  │   MinIO    │                            │
│     │ WMS/WFS   │  │  (media)   │                            │
│     └───────────┘  └────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, get JWT |
| GET | `/auth/me` | Current user |

### Projects
| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List accessible projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Project detail + members |
| PATCH | `/projects/:id` | Update project |
| POST | `/projects/:id/members` | Add member |

### Forms
| Method | Path | Description |
|---|---|---|
| GET | `/projects/:id/forms` | List forms |
| POST | `/projects/:id/forms` | Create form |
| GET | `/forms/:id` | Get form schema |
| PATCH | `/forms/:id` | Update schema |
| POST | `/forms/:id/publish` | Publish form |

### Features
| Method | Path | Description |
|---|---|---|
| POST | `/features` | Submit single feature |
| POST | `/features/batch` | Batch sync (offline) |
| GET | `/projects/:id/features` | Get as GeoJSON FeatureCollection |
| GET | `/features/:id` | Single feature |

### Geo API (port 3002)
| Method | Path | Description |
|---|---|---|
| POST | `/geometry/validate` | Validate GeoJSON geometry |
| POST | `/geometry/centroid` | Get centroid |
| POST | `/export/` | Export features (geojson/gpkg/shapefile/kml/csv) |
| POST | `/geoserver/workspace/init` | Init GeoServer workspace |
| POST | `/geoserver/layers/publish` | Publish layer |

---

## Roles

| Role | Permissions |
|---|---|
| `field_collector` | Collect features, sync data |
| `project_manager` | + Manage projects, publish forms |
| `gis_analyst` | + Export data, manage layers |
| `platform_admin` | Full access |

---

## Phase 2 Roadmap
- Geofencing engine (Turf.js client-side)
- Media attachments (photo/audio) via MinIO
- CRDT conflict resolution (Yjs)
- ArcGIS Feature Layer REST compatibility
- Shapefile/KML export from Studio UI
