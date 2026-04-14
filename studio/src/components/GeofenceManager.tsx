// studio/src/components/GeofenceManager.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeofenceZone {
  id: string;
  name: string;
  polygon: GeoJSON.Polygon;
  assigned_to: string | null; // user_id or null = open zone
}

export interface ProjectMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Props {
  zones: GeofenceZone[];
  members: ProjectMember[];   // project member list for assignment dropdown
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

export default function GeofenceManager({ zones, members, onUpdate }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);

  const [drawing, setDrawing]         = useState(false);
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);
  const [draftName, setDraftName]     = useState("");
  const [draftAssignee, setDraftAssignee] = useState<string>("");
  const draftMarkersRef               = useRef<maplibregl.Marker[]>([]);

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

  // ── Re-render zones on prop change ──────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;
    renderZones(map, zones);
  }, [zones]);

  // ── Render all zones ─────────────────────────────────────────────────────────
  function renderZones(map: maplibregl.Map, zoneList: GeofenceZone[]) {
    // Clean up previous layers (up to 30 zones)
    for (let i = 0; i < 30; i++) {
      [`zone-${i}-fill`, `zone-${i}-line`].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
      if (map.getSource(`zone-${i}`)) map.removeSource(`zone-${i}`);
    }
    zoneList.forEach((zone, idx) => {
      const color    = ZONE_COLORS[idx % ZONE_COLORS.length];
      const sourceId = `zone-${idx}`;
      map.addSource(sourceId, { type: "geojson", data: { type: "Feature", geometry: zone.polygon, properties: {} } });
      map.addLayer({ id: `${sourceId}-fill`, type: "fill", source: sourceId, paint: { "fill-color": color, "fill-opacity": 0.12 } });
      map.addLayer({ id: `${sourceId}-line`, type: "line", source: sourceId, paint: { "line-color": color, "line-width": 2.5, "line-dasharray": [4, 2] } });
    });
    if (zoneList.length > 0) {
      const allCoords = zoneList.flatMap(z => z.polygon.coordinates[0]);
      const lngs = allCoords.map(c => c[0]);
      const lats = allCoords.map(c => c[1]);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 60, maxZoom: 14, animate: false }
      );
    }
  }

  // ── Drawing mode ─────────────────────────────────────────────────────────────
  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!drawing) return;
    const map = mapInstance.current; if (!map) return;
    const { lng, lat } = e.lngLat;
    setDraftPoints(prev => {
      const dot = new maplibregl.Marker({ color: "#f59e0b", scale: 0.6 }).setLngLat([lng, lat]).addTo(map);
      draftMarkersRef.current.push(dot);
      return [...prev, [lng, lat] as [number, number]];
    });
  }, [drawing]);

  useEffect(() => {
    const map = mapInstance.current; if (!map) return;
    map.on("click", handleMapClick);
    return () => { map.off("click", handleMapClick); };
  }, [handleMapClick]);

  const finishZone = () => {
    if (draftPoints.length < 3) { alert("Draw at least 3 points."); return; }
    const name     = draftName.trim() || `Zone ${zones.length + 1}`;
    const closed: [number, number][] = [...draftPoints, draftPoints[0]];
    const newZone: GeofenceZone = {
      id:          crypto.randomUUID(),
      name,
      polygon:     { type: "Polygon", coordinates: [closed] },
      assigned_to: draftAssignee || null,
    };
    onUpdate([...zones, newZone]);
    cancelDraw();
  };

  const cancelDraw = () => {
    draftMarkersRef.current.forEach(m => m.remove());
    draftMarkersRef.current = [];
    setDraftPoints([]);
    setDraftName("");
    setDraftAssignee("");
    setDrawing(false);
  };

  const deleteZone  = (id: string) => onUpdate(zones.filter(z => z.id !== id));
  const renameZone  = (id: string, name: string) => onUpdate(zones.map(z => z.id === id ? { ...z, name } : z));
  const assignZone  = (id: string, userId: string) => onUpdate(zones.map(z => z.id === id ? { ...z, assigned_to: userId || null } : z));

  const getMemberName = (userId: string | null) => {
    if (!userId) return null;
    const m = members.find(m => m.id === userId);
    return m ? m.full_name : "Unknown";
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* Map */}
      <div style={{ position: "relative", height: 380, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />
        {drawing && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "#fff", border: "1px solid #fbbf24", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#92400e", zIndex: 10, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            ✏️ Click to add points ({draftPoints.length} placed)
          </div>
        )}
      </div>

      {/* Drawing controls */}
      {drawing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              className="input flex-1"
              placeholder={`Zone name (default: Zone ${zones.length + 1})`}
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
            />
            {/* Assign worker while drawing */}
            <select
              className="input"
              style={{ maxWidth: 200 }}
              value={draftAssignee}
              onChange={e => setDraftAssignee(e.target.value)}
            >
              <option value="">Assign worker (optional)</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm flex-1" onClick={finishZone} disabled={draftPoints.length < 3}>
              ✓ Finish Zone
            </button>
            <button className="btn btn-secondary btn-sm" onClick={cancelDraw}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-secondary w-full" onClick={() => setDrawing(true)}>
          + Draw New Zone
        </button>
      )}

      {/* Zone list */}
      {zones.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zones ({zones.length})</p>
          {zones.map((zone, idx) => (
            <div key={zone.id} className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                {/* Colour swatch */}
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: ZONE_COLORS[idx % ZONE_COLORS.length], flexShrink: 0 }} />
                {/* Zone name */}
                <input
                  className="input flex-1 py-1 text-sm"
                  value={zone.name}
                  onChange={e => renameZone(zone.id, e.target.value)}
                  placeholder="Zone name"
                />
                {/* Delete */}
                <button
                  className="btn btn-ghost btn-sm text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteZone(zone.id)}
                  title="Delete zone"
                >🗑</button>
              </div>

              {/* Worker assignment */}
              <div className="flex items-center gap-2 pl-6">
                <span className="text-xs text-slate-400 shrink-0">Assigned to:</span>
                <select
                  className="input py-1 text-xs flex-1"
                  value={zone.assigned_to || ""}
                  onChange={e => assignZone(zone.id, e.target.value)}
                >
                  <option value="">Open zone — any worker</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                  ))}
                </select>
              </div>

              {/* Assignment badge */}
              {zone.assigned_to ? (
                <div className="flex items-center gap-1.5 pl-6">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                    👷 {getMemberName(zone.assigned_to)}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 pl-6">Open zone — all workers can submit here</p>
              )}
            </div>
          ))}
        </div>
      )}

      {zones.length === 0 && !drawing && (
        <p className="text-xs text-slate-400 text-center py-2">
          No zones yet. Click "Draw New Zone" to define a geofence boundary and assign it to a worker.
        </p>
      )}
    </div>
  );
}
