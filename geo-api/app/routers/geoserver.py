from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx, os

router = APIRouter()

GEOSERVER_URL = os.getenv("GEOSERVER_URL", "http://geoserver:8080/geoserver")
GEOSERVER_USER = os.getenv("GEOSERVER_USER", "admin")
GEOSERVER_PASS = os.getenv("GEOSERVER_PASS", "geoserver")
PG_HOST = os.getenv("POSTGRES_HOST", "postgres")
PG_DB = os.getenv("POSTGRES_DB", "geocollect")
PG_USER = os.getenv("POSTGRES_USER", "geocollect")
PG_PASS = os.getenv("POSTGRES_PASSWORD", "geocollect")
WORKSPACE = "geocollect"

def gs_auth():
    return (GEOSERVER_USER, GEOSERVER_PASS)

def gs_headers():
    return {"Content-Type": "application/json", "Accept": "application/json"}

class PublishLayerRequest(BaseModel):
    layer_name: str
    table_name: Optional[str] = None
    title: Optional[str] = None

@router.post("/workspace/init")
def init_workspace():
    """Create the geocollect workspace and PostGIS datastore in GeoServer."""
    base = GEOSERVER_URL + "/rest"
    auth = gs_auth()
    # Create workspace
    ws_resp = httpx.post(
        f"{base}/workspaces",
        json={"workspace": {"name": WORKSPACE}},
        auth=auth, headers=gs_headers(), timeout=30
    )
    # Create datastore
    ds_body = {
        "dataStore": {
            "name": "geocollect_postgis",
            "connectionParameters": {
                "entry": [
                    {"@key": "host", "$": PG_HOST},
                    {"@key": "port", "$": "5432"},
                    {"@key": "database", "$": PG_DB},
                    {"@key": "user", "$": PG_USER},
                    {"@key": "passwd", "$": PG_PASS},
                    {"@key": "dbtype", "$": "postgis"},
                    {"@key": "schema", "$": "public"}
                ]
            }
        }
    }
    ds_resp = httpx.post(
        f"{base}/workspaces/{WORKSPACE}/datastores",
        json=ds_body, auth=auth, headers=gs_headers(), timeout=30
    )
    return {
        "workspace_status": ws_resp.status_code,
        "datastore_status": ds_resp.status_code
    }

@router.post("/layers/publish")
def publish_layer(body: PublishLayerRequest):
    """Publish a PostGIS table as a WFS/WMS layer in GeoServer."""
    base = GEOSERVER_URL + "/rest"
    table = body.table_name or body.layer_name
    ft_body = {
        "featureType": {
            "name": body.layer_name,
            "nativeName": table,
            "title": body.title or body.layer_name,
            "srs": "EPSG:4326",
            "enabled": True
        }
    }
    resp = httpx.post(
        f"{base}/workspaces/{WORKSPACE}/datastores/geocollect_postgis/featuretypes",
        json=ft_body, auth=auth_gs(), headers=gs_headers(), timeout=30
    )
    if resp.status_code not in (200, 201):
        raise HTTPException(502, detail=f"GeoServer error: {resp.text}")
    return {"published": body.layer_name, "wms": f"{GEOSERVER_URL}/{WORKSPACE}/wms", "wfs": f"{GEOSERVER_URL}/{WORKSPACE}/wfs"}

def auth_gs():
    return (GEOSERVER_USER, GEOSERVER_PASS)

@router.get("/layers")
def list_layers():
    resp = httpx.get(
        f"{GEOSERVER_URL}/rest/workspaces/{WORKSPACE}/layers",
        auth=gs_auth(), headers=gs_headers(), timeout=30
    )
    return resp.json()
