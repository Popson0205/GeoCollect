// field/src/pages/CollectPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getDB, saveFeatureOffline } from "../lib/db";
import { syncPendingFeatures } from "../lib/sync";
import { v4 as uuid } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption { label: string; value: string; }

interface FieldDef {
  id: string;
  key: string;
  label: string;
  type: string;
  required?: boolean;
  hint?: string;
  options?: SelectOption[];
  formula?: string;
}

interface GeofencePolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

interface FormSchema {
  id: string;
  name: string;
  geometry_type: string;
  schema: { fields: FieldDef[] };
  geofence?: GeofencePolygon | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEVICE_ID = (() => {
  let id = localStorage.getItem("gc_device_id");
  if (!id) { id = uuid(); localStorage.setItem("gc_device_id", id); }
  return id;
})();

// Google Hybrid satellite tiles — same as Studio
const GOOGLE_HYBRID_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "google-hybrid": {
      type: "raster",
      tiles: ["https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"],
      tileSize: 256,
      attribution: "© Google",
    },
  },
  layers: [{ id: "google-hybrid", type: "raster", source: "google-hybrid" }],
};

// Nigeria centroid + comfortable zoom
const NIGERIA_CENTER: [number, number] = [8.6753, 9.082];
const NIGERIA_ZOOM = 6;

// ─── Point-in-polygon helper (ray casting) ───────────────────────────────────

function pointInPolygon(
  point: [number, number],
  polygon: GeofencePolygon
): boolean {
  const [px, py] = point;
  const ring = polygon.coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── Field Input ──────────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    background: "#fff",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const focusStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = "#2563eb";
    (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = "#e2e8f0";
    (e.target as HTMLElement).style.boxShadow = "none";
  };

  switch (field.type) {
    case "text":
      return (
        <input
          style={base}
          type="text"
          placeholder={field.hint || ""}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      );

    case "number":
      return (
        <input
          style={base}
          type="number"
          placeholder={field.hint || ""}
          value={(value as string) || ""}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      );

    case "date":
      return (
        <input
          style={base}
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      );

    case "datetime":
      return (
        <input
          style={base}
          type="datetime-local"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      );

    case "boolean":
      return (
        <div style={{ display: "flex", gap: 12 }}>
          {["Yes", "No"].map((opt) => (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: 8,
                border: `2px solid ${value === opt ? "#2563eb" : "#e2e8f0"}`,
                background: value === opt ? "#eff6ff" : "#fff",
                color: value === opt ? "#2563eb" : "#64748b",
                fontWeight: value === opt ? 600 : 400,
                transition: "all 0.15s",
                flex: 1,
                justifyContent: "center",
              }}
            >
              <input
                type="radio"
                name={field.key}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                style={{ display: "none" }}
              />
              {opt === "Yes" ? "✓ Yes" : "✗ No"}
            </label>
          ))}
        </div>
      );

    case "select":
      return (
        <select
          style={{
            ...base,
            appearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: 36,
          }}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        >
          <option value="">Select an option…</option>
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case "multiselect": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "4px 0",
          }}
        >
          {(field.options || []).map((o) => {
            const checked = selected.includes(o.value);
            return (
              <label
                key={o.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `2px solid ${checked ? "#2563eb" : "#e2e8f0"}`,
                  background: checked ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  color: checked ? "#2563eb" : "#1e293b",
                  fontWeight: checked ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `2px solid ${checked ? "#2563eb" : "#cbd5e1"}`,
                    background: checked ? "#2563eb" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {o.label}
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, o.value]
                      : selected.filter((v) => v !== o.value);
                    onChange(next);
                  }}
                  style={{ display: "none" }}
                />
              </label>
            );
          })}
        </div>
      );
    }

    case "rating":
      return (
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              style={{
                fontSize: 28,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: (value as number) >= n ? "#f59e0b" : "#e2e8f0",
                padding: "0 2px",
                transition: "color 0.1s",
              }}
            >
              ★
            </button>
          ))}
        </div>
      );

    case "photo":
      return (
        <div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 16px",
              borderRadius: 10,
              border: "2px dashed #cbd5e1",
              background: "#f8fafc",
              cursor: "pointer",
              fontSize: 14,
              color: "#64748b",
            }}
          >
            📷 {value ? "Change photo" : "Take / upload photo"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onChange(reader.result);
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {value && (
            <img
              src={value as string}
              alt="captured"
              style={{
                width: "100%",
                borderRadius: 10,
                marginTop: 8,
                maxHeight: 240,
                objectFit: "cover",
              }}
            />
          )}
        </div>
      );

    case "audio":
      return (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 10,
            border: "2px dashed #cbd5e1",
            background: "#f8fafc",
            cursor: "pointer",
            fontSize: 14,
            color: "#64748b",
          }}
        >
          🎙 Record / upload audio
          <input
            type="file"
            accept="audio/*"
            capture="microphone"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onChange(reader.result);
              reader.readAsDataURL(file);
            }}
          />
        </label>
      );

    default:
      return (
        <input
          style={base}
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      );
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollectPage() {
  const { projectId, formId } = useParams<{
    projectId: string;
    formId: string;
  }>();
  const nav = useNavigate();

  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef   = useRef<maplibregl.Marker | null>(null);

  const [form, setForm]         = useState<FormSchema | null>(null);
  const [geometry, setGeometry] = useState<GeoJSON.Geometry | null>(null);
  const [attrs, setAttrs]       = useState<Record<string, unknown>>({});
  const [step, setStep]         = useState<"map" | "form">("map");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [geofenceWarning, setGeofenceWarning] = useState(false);

  // Load form from IndexedDB
  useEffect(() => {
    (async () => {
      const db = await getDB();
      const f = await db.get("forms", formId!);
      if (f) setForm(f as FormSchema);
    })();
  }, [formId]);

  // Init map
  useEffect(() => {
    if (step !== "map" || !mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: GOOGLE_HYBRID_STYLE,
      center: NIGERIA_CENTER,
      zoom: NIGERIA_ZOOM,
    });
    mapInstance.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      }),
      "top-right"
    );

    map.on("load", () => {
      // Draw geofence boundary if present
      const geofence = (form as FormSchema & { geofence?: GeofencePolygon })
        ?.geofence;
      if (geofence) {
        map.addSource("geofence", {
          type: "geojson",
          data: { type: "Feature", geometry: geofence, properties: {} },
        });
        map.addLayer({
          id: "geofence-fill",
          type: "fill",
          source: "geofence",
          paint: { "fill-color": "#2563eb", "fill-opacity": 0.08 },
        });
        map.addLayer({
          id: "geofence-line",
          type: "line",
          source: "geofence",
          paint: {
            "line-color": "#2563eb",
            "line-width": 2,
            "line-dasharray": [4, 2],
          },
        });

        // Fit to geofence
        const coords = geofence.coordinates[0];
        const lngs = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 60, maxZoom: 14 }
        );
      }
    });

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;

      // Check geofence
      const geofence = (form as FormSchema & { geofence?: GeofencePolygon })
        ?.geofence;
      if (geofence) {
        const inside = pointInPolygon([lng, lat], geofence);
        setGeofenceWarning(!inside);
        if (!inside) {
          // Still allow placement but warn
        }
      }

      // Place / move marker
      if (markerRef.current) markerRef.current.remove();
      const marker = new maplibregl.Marker({ color: "#2563eb" })
        .setLngLat([lng, lat])
        .addTo(map);
      markerRef.current = marker;
      setGeometry({ type: "Point", coordinates: [lng, lat] });
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form]);

  // Submit
  const submit = async () => {
    if (!geometry) return;
    setSubmitting(true);
    const feature = {
      id: uuid(),
      form_schema_id: formId!,
      project_id: projectId!,
      geometry,
      attributes: attrs,
      device_id: DEVICE_ID,
      synced: false,
      created_at: Date.now(),
    };
    await saveFeatureOffline(feature);
    if (navigator.onLine) {
      await syncPendingFeatures().catch(console.error);
    }
    setDone(true);
    setSubmitting(false);
  };

  // ── Done screen ────────────────────────────────────────
  if (done) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: 24,
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
          }}
        >
          ✅
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
          Submitted!
        </h2>
        <p style={{ color: "#64748b", textAlign: "center", fontSize: 14 }}>
          {navigator.onLine
            ? "Synced to server successfully."
            : "Saved offline — will sync when connected."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
          <button
            className="btn btn-primary"
            style={{ justifyContent: "center", padding: "12px 16px" }}
            onClick={() => {
              setDone(false);
              setGeometry(null);
              setAttrs({});
              setStep("map");
              setGeofenceWarning(false);
            }}
          >
            Collect Another
          </button>
          <button
            className="btn btn-ghost"
            style={{ justifyContent: "center" }}
            onClick={() => nav("/projects")}
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const fields = form?.schema?.fields || [];
  const requiredMissing = fields
    .filter((f) => f.required)
    .some((f) => {
      const v = attrs[f.key];
      if (Array.isArray(v)) return v.length === 0;
      return v === undefined || v === null || v === "";
    });

  // ── Main layout ────────────────────────────────────────
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          className="btn btn-ghost"
          style={{ padding: "6px 10px", borderRadius: 8 }}
          onClick={() =>
            step === "form" ? setStep("map") : nav("/projects")
          }
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", truncate: true } as React.CSSProperties}>
            {form?.name || "Loading…"}
          </p>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
            {step === "map"
              ? "Tap the map to place your location"
              : `Fill in ${fields.length} field${fields.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {/* Step dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["map", "form"].map((s) => (
            <span
              key={s}
              style={{
                width: step === s ? 20 : 8,
                height: 8,
                borderRadius: 99,
                background: step === s ? "#2563eb" : "#e2e8f0",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Map step ────────────────────────────────────── */}
      {step === "map" && (
        <>
          <div ref={mapRef} style={{ flex: 1 }} />

          {/* Geofence warning banner */}
          {geofenceWarning && (
            <div
              style={{
                position: "absolute",
                top: 60,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#fef3c7",
                color: "#92400e",
                padding: "8px 16px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                zIndex: 10,
                whiteSpace: "nowrap",
              }}
            >
              ⚠️ Location is outside the geofence boundary
            </div>
          )}

          {/* Bottom action bar */}
          <div
            style={{
              background: "#fff",
              borderTop: "1px solid #e2e8f0",
              padding: "14px 16px",
              flexShrink: 0,
            }}
          >
            {geometry ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: geofenceWarning ? "#d97706" : "#16a34a",
                    }}
                  >
                    {geofenceWarning ? "⚠️" : "📍"}{" "}
                    {(geometry as GeoJSON.Point).coordinates[1].toFixed(5)},{" "}
                    {(geometry as GeoJSON.Point).coordinates[0].toFixed(5)}
                  </p>
                  {geofenceWarning && (
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Outside boundary — tap again to reposition
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ flexShrink: 0 }}
                  onClick={() => setStep("form")}
                >
                  Next →
                </button>
              </div>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "4px 0",
                }}
              >
                Tap the map to place a point, or use the 📍 locate button
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Form step ───────────────────────────────────── */}
      {step === "form" && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 16px 100px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {fields.map((field) => (
            <div key={field.id}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {field.label}
                {field.required && (
                  <span style={{ color: "#dc2626", marginLeft: 3 }}>*</span>
                )}
              </label>
              <FieldInput
                field={field}
                value={attrs[field.key]}
                onChange={(v) =>
                  setAttrs((a) => ({ ...a, [field.key]: v }))
                }
              />
              {field.hint && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    marginTop: 5,
                    lineHeight: 1.4,
                  }}
                >
                  {field.hint}
                </p>
              )}
            </div>
          ))}

          {/* Submit */}
          <button
            className="btn btn-primary"
            style={{
              justifyContent: "center",
              padding: "14px 16px",
              marginTop: 8,
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 12,
              opacity: requiredMissing ? 0.5 : 1,
            }}
            onClick={submit}
            disabled={submitting || requiredMissing}
          >
            {submitting
              ? "Saving…"
              : navigator.onLine
              ? "✓ Submit & Sync"
              : "💾 Save Offline"}
          </button>

          {requiredMissing && (
            <p
              style={{
                fontSize: 12,
                color: "#dc2626",
                textAlign: "center",
                marginTop: -8,
              }}
            >
              Please fill in all required fields
            </p>
          )}
        </div>
      )}
    </div>
  );
}
