from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import geopandas as gpd
import json, io, zipfile, tempfile, os
from shapely.geometry import shape

router = APIRouter()

class ExportRequest(BaseModel):
    features: List[Dict[str, Any]]
    format: str  # geojson | gpkg | shapefile | kml | csv
    layer_name: Optional[str] = "geocollect_features"

def features_to_gdf(features):
    geoms, props = [], []
    for f in features:
        try:
            geoms.append(shape(f["geometry"]))
            props.append(f.get("properties", {}))
        except Exception:
            pass
    return gpd.GeoDataFrame(props, geometry=geoms, crs="EPSG:4326")

@router.post("/")
def export_features(body: ExportRequest):
    gdf = features_to_gdf(body.features)
    fmt = body.format.lower()
    name = body.layer_name

    if fmt == "geojson":
        content = gdf.to_json()
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="application/geo+json",
            headers={"Content-Disposition": f'attachment; filename="{name}.geojson"'}
        )

    elif fmt == "gpkg":
        with tempfile.NamedTemporaryFile(suffix=".gpkg", delete=False) as tmp:
            gdf.to_file(tmp.name, driver="GPKG", layer=name)
            tmp.seek(0)
            data = open(tmp.name, "rb").read()
        os.unlink(tmp.name)
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/geopackage+sqlite3",
            headers={"Content-Disposition": f'attachment; filename="{name}.gpkg"'}
        )

    elif fmt == "shapefile":
        with tempfile.TemporaryDirectory() as tmpdir:
            shp_path = os.path.join(tmpdir, name + ".shp")
            gdf.to_file(shp_path, driver="ESRI Shapefile")
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for fn in os.listdir(tmpdir):
                    zf.write(os.path.join(tmpdir, fn), fn)
            buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{name}_shp.zip"'}
        )

    elif fmt == "kml":
        with tempfile.NamedTemporaryFile(suffix=".kml", delete=False) as tmp:
            gdf.to_file(tmp.name, driver="KML")
            data = open(tmp.name, "rb").read()
        os.unlink(tmp.name)
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/vnd.google-earth.kml+xml",
            headers={"Content-Disposition": f'attachment; filename="{name}.kml"'}
        )

    elif fmt == "csv":
        gdf["geometry_wkt"] = gdf.geometry.apply(lambda g: g.wkt if g else None)
        df = gdf.drop(columns=["geometry"])
        content = df.to_csv(index=False)
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{name}.csv"'}
        )

    else:
        raise HTTPException(400, detail=f"Unsupported format: {fmt}")
