// studio/src/components/GeofenceManager.tsx
// Multi-zone geofence manager for the Studio form builder.
//
// Usage:
//   <GeofenceManager zones={form.geofences} onUpdate={zones => patchForm({ geofences: zones })} />
//
// Each zone: { id: string, name: string, polygon: GeoJSON.Polygon }
// Drawing: click "Draw Zone" → click 3+ points on map → click first point to close.
// Editing: not supported (delete + redraw).

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeofenceZone {
  id: string;
  name: string;
  polygon: GeoJSON.Polygon;
}

interface Props {
  zones: GeofenceZone[];
  onUpdate: (zones: GeofenceZone[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ZONE_COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#9333ea",
  "#0891b2", "#dc2626", "#0d9488", "#c026d3",
];

const NIGERIA_CENTER: [number, number] = [8.6753, 9.082];

const GOOGLE_HYBRID_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "google-hybrid": {
      type: "raster",
      tiles: ["https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"],
      tileSize: 256, attribution: "© Google",
    },
  },
  layers: [{ id: "google-hybrid", type: "raster", source: "google-hybrid" }],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GeofenceManager({ zones, onUpdate }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef  = useRef<maplibregl.Marker[]>([]);

  const [drawing, setDrawing]         = useState(false);
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);
  const [draftName, setDraftName]     = useState("");
  const draftLineRef                  = useRef<maplibregl.Marker[]>([]);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: GOOGLE_HYBRID_STYLE,
      center: NIGERIA_CENTER,
      zoom: 6,
    });
    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
      "top-right"
    );

    map.on("load", () => renderZones(map, zones));

    return () => { map.remove(); mapInstance.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-render zones when prop changes ───────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;
    renderZones(map, zones);
  }, [zones]);

  // ── Render all committed zones onto the map ─────────────────────────────────
  function renderZones(map: maplibregl.Map, zoneList: GeofenceZone[]) {
    // Remove existing zone layers/sources
    zoneList.forEach((_, i) => {
      [`zone-${i}-fill`, `zone-${i}-line`].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(`zone-${i}`)) map.removeSource(`zone-${i}`);
    });
    // Also clean up any previously rendered zones beyond current count
    for (let i = zoneList.length; i < zoneList.length + 20; i++) {
      [`zone-${i}-fill`, `zone-${i}-line`].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(`zone-${i}`)) map.removeSource(`zone-${i}`);
    }

    zoneList.forEach((zone, idx) => {
      const color    = ZONE_COLORS[idx % ZONE_COLORS.length];
      const sourceId = `zone-${idx}`;
      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "Feature", geometry: zone.polygon, properties: {} },
      });
      map.addLayer({ id: `${sourceId}-fill`, type: "fill", source: sourceId, paint: { "fill-color": color, "fill-opacity": 0.12 } });
      map.addLayer({ id: `${sourceId}-line`, type: "line", source: sourceId, paint: { "line-color": color, "line-width": 2.5, "line-dasharray": [4, 2] } });
    });

    // Auto-fit if zones exist
    if (zoneList.length > 0) {
      const allCoords = zoneList.flatMap((z) => z.polygon.coordinates[0]);
      const lngs = allCoords.map((c) => c[0]);
      const lats = allCoords.map((c) => c[1]);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 60, maxZoom: 14, animate: false }
      );
    }
  }

  // ── Drawing mode: click to add points ───────────────────────────────────────
  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (!drawing) return;
      const { lng, lat } = e.lngLat;
      const map = mapInstance.current; if (!map) return;

      setDraftPoints((prev) => {
        const next = [...prev, [lng, lat] as [number, number]];

        // Drop a small dot marker for each point
        const dot = new maplibregl.Marker({ color: "#f59e0b", scale: 0.6 })
          .setLngLat([lng, lat])
          .addTo(map);
        draftLineRef.current.push(dot);

        return next;
      });
    },
    [drawing]
  );

  useEffect(() => {
    const map = mapInstance.current; if (!map) return;
    map.on("click", handleMapClick);
    return () => { map.off("click", handleMapClick); };
  }, [handleMapClick]);

  // ── Finish drawing — close polygon ──────────────────────────────────────────
  const finishZone = () => {
    if (draftPoints.length < 3) {
      alert("Draw at least 3 points to create a zone.");
      return;
    }
    const name = draftName.trim() || `Zone ${zones.length + 1}`;
    const closed: [number, number][] = [...draftPoints, draftPoints[0]];
    const newZone: GeofenceZone = {
      id: crypto.randomUUID(),
      name,
      polygon: { type: "Polygon", coordinates: [closed] },
    };
    onUpdate([...zones, newZone]);
    cancelDraw();
  };

  // ── Cancel drawing ───────────────────────────────────────────────────────────
  const cancelDraw = () => {
    draftLineRef.current.forEach((m) => m.remove());
    draftLineRef.current = [];
    setDraftPoints([]);
    setDraftName("");
    setDrawing(false);
  };

  // ── Delete zone ──────────────────────────────────────────────────────────────
  const deleteZone = (id: string) => {
    onUpdate(zones.filter((z) => z.id !== id));
  };

  // ── Rename zone ──────────────────────────────────────────────────────────────
  const renameZone = (id: string, name: string) => {
    onUpdate(zones.map((z) => (z.id === id ? { ...z, name } : z)));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* Map */}
      <div style={{ position: "relative", height: 380, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />

        {/* Drawing mode overlay */}
        {drawing && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "#fff", border: "1px solid #fbbf24", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#92400e", zIndex: 10, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            ✏️ Click to add points ({draftPoints.length} placed)
          </div>
        )}
      </div>

      {/* Drawing controls */}
      {drawing ? (
        <div className="flex items-center gap-2">
          <input
            className="input flex-1"
            placeholder={`Zone name (default: Zone ${zones.length + 1})`}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={finishZone}
            disabled={draftPoints.length < 3}
          >
            ✓ Finish Zone
          </button>
          <button className="btn btn-secondary btn-sm" onClick={cancelDraw}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="btn btn-secondary w-full"
          onClick={() => setDrawing(true)}
        >
          + Draw New Zone
        </button>
      )}

      {/* Zone list */}
      {zones.length > 0 && (
        <div className="flex flex-col gap-2">
          {zones.map((zone, idx) => (
            <div key={zone.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
              {/* Colour swatch */}
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: ZONE_COLORS[idx % ZONE_COLORS.length], flexShrink: 0, display: "inline-block" }} />
              {/* Editable name */}
              <input
                className="input flex-1 py-1 text-sm"
                value={zone.name}
                onChange={(e) => renameZone(zone.id, e.target.value)}
              />
              {/* Delete */}
              <button
                className="btn btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => deleteZone(zone.id)}
                title="Delete zone"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {zones.length === 0 && !drawing && (
        <p className="text-xs text-slate-400 text-center py-2">
          No zones yet. Click "Draw New Zone" to define a geofence boundary.
        </p>
      )}
    </div>
  );
}
