import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getDB, saveFeatureOffline } from "../lib/db";
import { syncPendingFeatures } from "../lib/sync";
import { v4 as uuid } from "uuid";

interface FieldDef {
  id: string; key: string; label: string; type: string; required?: boolean;
  hint?: string; options?: { label: string; value: string }[];
}
interface FormSchema {
  id: string; name: string; geometry_type: string;
  schema: { fields: FieldDef[] };
}

const DEVICE_ID = (() => {
  let id = localStorage.getItem("gc_device_id");
  if (!id) { id = uuid(); localStorage.setItem("gc_device_id", id); }
  return id;
})();

function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const base = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 };
  switch (field.type) {
    case "text": return <input style={base} type="text" placeholder={field.hint} value={(value as string) || ""} onChange={e => onChange(e.target.value)} />;
    case "number": return <input style={base} type="number" placeholder={field.hint} value={(value as string) || ""} onChange={e => onChange(parseFloat(e.target.value))} />;
    case "date": return <input style={base} type="date" value={(value as string) || ""} onChange={e => onChange(e.target.value)} />;
    case "datetime": return <input style={base} type="datetime-local" value={(value as string) || ""} onChange={e => onChange(e.target.value)} />;
    case "boolean": return (
      <div style={{ display: "flex", gap: 12 }}>
        {["Yes","No"].map(opt => (
          <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
            <input type="radio" name={field.key} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    );
    case "select": return (
      <select style={base} value={(value as string) || ""} onChange={e => onChange(e.target.value)}>
        <option value="">Select…</option>
        {(field.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
    case "rating": return (
      <div style={{ display: "flex", gap: 8 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer", color: (value as number) >= n ? "#f59e0b" : "#e2e8f0" }}>★</button>
        ))}
      </div>
    );
    case "photo": return (
      <div>
        <input type="file" accept="image/*" capture="environment" style={{ fontSize: 13 }}
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange(reader.result);
            reader.readAsDataURL(file);
          }} />
        {value && <img src={value as string} alt="captured" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />}
      </div>
    );
    default: return <input style={base} type="text" value={(value as string) || ""} onChange={e => onChange(e.target.value)} />;
  }
}

export default function CollectPage() {
  const { projectId, formId } = useParams<{ projectId: string; formId: string }>();
  const nav = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [form, setForm] = useState<FormSchema | null>(null);
  const [geometry, setGeometry] = useState<GeoJSON.Geometry | null>(null);
  const [attrs, setAttrs] = useState<Record<string, unknown>>({});
  const [step, setStep] = useState<"map" | "form">("map");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDB();
      const f = await db.get("forms", formId!);
      if (f) setForm(f as FormSchema);
    })();
  }, [formId]);

  useEffect(() => {
    if (step !== "map" || !mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 20],
      zoom: 2,
    });
    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserLocation: true }));

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      if (markerRef.current) markerRef.current.remove();
      const marker = new maplibregl.Marker({ color: "#2563eb" }).setLngLat([lng, lat]).addTo(map);
      markerRef.current = marker;
      setGeometry({ type: "Point", coordinates: [lng, lat] });
    });

    return () => map.remove();
  }, [step]);

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

  if (done) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
      <div style={{ fontSize: 56 }}>✅</div>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Submitted!</h2>
      <p style={{ color: "#64748b", textAlign: "center" }}>{navigator.onLine ? "Synced to server." : "Saved offline — will sync when connected."}</p>
      <button className="btn btn-primary" onClick={() => { setDone(false); setGeometry(null); setAttrs({}); setStep("map"); }}>Collect Another</button>
      <button className="btn btn-ghost" onClick={() => nav("/projects")}>Back to Projects</button>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => step === "form" ? setStep("map") : nav("/projects")}>←</button>
        <div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{form?.name || "Loading…"}</p>
          <p style={{ fontSize: 11, color: "#64748b" }}>{step === "map" ? "Tap map to place location" : "Fill in attributes"}</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: step === "map" ? "#2563eb" : "#e2e8f0", display: "inline-block" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: step === "form" ? "#2563eb" : "#e2e8f0", display: "inline-block" }} />
        </div>
      </div>

      {/* Map step */}
      {step === "map" && (
        <>
          <div ref={mapRef} style={{ flex: 1 }} />
          <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: 16 }}>
            {geometry ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 13, color: "#16a34a" }}>
                  📍 {(geometry as GeoJSON.Point).coordinates[1].toFixed(5)}, {(geometry as GeoJSON.Point).coordinates[0].toFixed(5)}
                </p>
                <button className="btn btn-primary" onClick={() => setStep("form")}>Next: Fill Form →</button>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>Tap the map to place a point, or use the locate button</p>
            )}
          </div>
        </>
      )}

      {/* Form step */}
      {step === "form" && (
        <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {(form?.schema?.fields || []).map(field => (
            <div key={field.id}>
              <label className="label">{field.label}{field.required && <span style={{ color: "#dc2626" }}> *</span>}</label>
              <FieldInput field={field} value={attrs[field.key]} onChange={v => setAttrs(a => ({ ...a, [field.key]: v }))} />
              {field.hint && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{field.hint}</p>}
            </div>
          ))}
          <button className="btn btn-primary" style={{ justifyContent: "center", padding: "12px 16px", marginTop: 8 }}
            onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : navigator.onLine ? "Submit & Sync" : "Save Offline"}
          </button>
        </div>
      )}
    </div>
  );
}
