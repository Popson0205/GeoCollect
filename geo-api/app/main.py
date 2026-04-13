from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import geometry, export, geoserver
import os

app = FastAPI(title="GeoCollect Geo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(geometry.router, prefix="/geometry", tags=["Geometry"])
app.include_router(export.router, prefix="/export", tags=["Export"])
app.include_router(geoserver.router, prefix="/geoserver", tags=["GeoServer"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "geocollect-geo-api"}
