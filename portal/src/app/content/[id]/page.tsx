// ── Feature Layer Detail (/content/[id]) ─────────────────
"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { ChevronRight, Download, Share2, Edit, Trash2, RefreshCw, Upload, Globe, Lock, Users, Plus } from "lucide-react";

type Tab = "overview" | "data" | "visualization" | "usage" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id:"overview",      label:"Overview" },
  { id:"data",          label:"Data" },
  { id:"visualization", label:"Visualization" },
  { id:"usage",         label:"Usage" },
  { id:"settings",      label:"Settings" },
];

const FIELDS = [
  { name:"OBJECTID",     type:"OID",      nullable:false, alias:"Object ID" },
  { name:"name",         type:"String",   nullable:true,  alias:"Name" },
  { name:"status",       type:"String",   nullable:true,  alias:"Status" },
  { name:"area_m2",      type:"Double",   nullable:true,  alias:"Area (m²)" },
  { name:"created_date", type:"Date",     nullable:true,  alias:"Created Date" },
  { name:"collector",    type:"String",   nullable:true,  alias:"Collector" },
  { name:"geometry",     type:"Geometry", nullable:false, alias:"Shape" },
];

const RECORDS = [
  { OBJECTID:1, name:"Survey Point A", status:"active",   area_m2:142.5, created_date:"2026-04-10", collector:"Faridat A" },
  { OBJECTID:2, name:"Survey Point B", status:"pending",  area_m2:89.3,  created_date:"2026-04-11", collector:"Faridat A" },
  { OBJECTID:3, name:"Survey Point C", status:"active",   area_m2:204.1, created_date:"2026-04-12", collector:"Field User" },
  { OBJECTID:4, name:"Survey Point D", status:"inactive", area_m2:56.7,  created_date:"2026-04-13", collector:"Field User" },
  { OBJECTID:5, name:"Survey Point E", status:"active",   area_m2:318.2, created_date:"2026-04-14", collector:"Faridat A" },
];

export default function FeatureLayerDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab]         = useState<Tab>("overview");
  const [sharing, setSharing] = useState<"private" | "organization" | "public">("organization");

  return (
    <div className="gc-page" style={{ height:"100vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <TopNav/>
      <div className="gc-detail-hdr">
        <div className="gc-breadcrumb">
          <Link href="/content" style={{ color:"var(--c-link)" }}>Content</Link>
          <ChevronRight size={12}/>
          <span>Niger Delta Asset Survey</span>
        </div>
        <div className="gc-detail-title-row">
          <div className="gc-detail-icon" style={{ background:"#fff3e0" }}>🗂️</div>
          <div>
            <div className="gc-detail-name">Niger Delta Asset Survey</div>
            <div className="gc-detail-sub">Feature layer (hosted) · Last modified Apr 16, 2026 · Owner: Faridat A</div>
          </div>
          <div className="gc-detail-actions">
            <button className="gc-btn gc-btn-default gc-btn-sm" style={{ gap:5 }}><Download size={12}/> Export</button>
            <button className="gc-btn gc-btn-default gc-btn-sm" style={{ gap:5 }}><Share2 size={12}/> Share</button>
            <button className="gc-btn gc-btn-primary gc-btn-sm" style={{ gap:5 }}><Edit size={12}/> Edit</button>
          </div>
        </div>
        <div className="gc-tabs">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`gc-tab ${tab === t.id ? "active" : ""}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 256px", gap:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Info */}
              <div className="gc-card" style={{ padding:18 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Layer Information</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 24px" }}>
                  {[["Item ID", id ?? "fl1"], ["Type","Feature Layer"], ["Geometry Type","Point"], ["Coordinate System","WGS 1984 (EPSG:4326)"], ["Feature Count","5"], ["Service URL","https://services.arcgis.com/…"], ["Created","Apr 10, 2026"], ["Modified","Apr 16, 2026"]].map(([k,v]) => (
                    <div key={k as string}>
                      <div style={{ fontSize:11, color:"var(--c-text-4)", marginBottom:2 }}>{k}</div>
                      <div style={{ fontSize:12, fontWeight:500, color:"var(--c-text)", wordBreak:"break-all" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Fields */}
              <div className="gc-card" style={{ padding:18 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Fields ({FIELDS.length})</div>
                <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid var(--c-border-light)" }}>
                      {["Field Name","Alias","Type","Nullable"].map(h => (
                        <th key={h} style={{ textAlign:"left", padding:"6px 0 8px", color:"var(--c-text-4)", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:".05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FIELDS.map(f => (
                      <tr key={f.name} style={{ borderBottom:"1px solid var(--c-border-light)" }}>
                        <td style={{ padding:"7px 0", fontFamily:"monospace", color:"var(--c-blue)", fontSize:12 }}>{f.name}</td>
                        <td style={{ padding:"7px 0", color:"var(--c-text-2)" }}>{f.alias}</td>
                        <td style={{ padding:"7px 0", color:"var(--c-text-3)" }}>{f.type}</td>
                        <td style={{ padding:"7px 0", color:"var(--c-text-4)" }}>{f.nullable ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Right */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div className="gc-card" style={{ padding:16 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Sharing</div>
                {(["private","organization","public"] as const).map(s => (
                  <label key={s} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 0", cursor:"pointer", borderBottom:"1px solid var(--c-border-light)", fontSize:13 }}>
                    <input type="radio" name="sharing" value={s} checked={sharing===s} onChange={() => setSharing(s)} style={{ accentColor:"var(--c-blue)" }}/>
                    <span style={{ textTransform:"capitalize" }}>{s}</span>
                  </label>
                ))}
                <button className="gc-btn gc-btn-primary gc-btn-sm" style={{ marginTop:12, width:"100%", justifyContent:"center" }}>Save Sharing</button>
              </div>
              <div className="gc-card" style={{ padding:16 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>Thumbnail</div>
                <div style={{ aspectRatio:"16/9", background:"linear-gradient(135deg,#e3f2fd,#90caf9)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>🗺️</div>
                <button className="gc-btn gc-btn-default gc-btn-sm" style={{ marginTop:8, width:"100%", justifyContent:"center" }}>Update Thumbnail</button>
              </div>
              <div className="gc-card" style={{ padding:16 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>Tags</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {["survey","niger delta","field","geospatial"].map(t => (
                    <span key={t} style={{ background:"var(--c-blue-light)", color:"var(--c-blue-dark)", fontSize:11, padding:"3px 8px", borderRadius:12 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DATA ── */}
        {tab === "data" && (
          <div className="gc-card" style={{ overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"var(--c-surface-2)", borderBottom:"1px solid var(--c-border)" }}>
              <span style={{ fontSize:12, fontWeight:600, color:"var(--c-text-3)" }}>{RECORDS.length} features</span>
              <div style={{ display:"flex", gap:7 }}>
                <button className="gc-btn gc-btn-default gc-btn-sm" style={{ gap:5 }}><Plus size={12}/> Add Feature</button>
                <button className="gc-btn gc-btn-default gc-btn-sm" style={{ gap:5 }}><Upload size={12}/> Append Data</button>
                <button className="gc-btn gc-btn-default gc-btn-sm" style={{ gap:5 }}><RefreshCw size={12}/></button>
              </div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table className="gc-table" style={{ borderRadius:0, border:"none", boxShadow:"none" }}>
                <thead><tr>{Object.keys(RECORDS[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
                <tbody>{RECORDS.map(r => <tr key={r.OBJECTID}>{Object.values(r).map((v,i) => <td key={i} style={{ fontFamily:"monospace", fontSize:12 }}>{String(v)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VISUALIZATION ── */}
        {tab === "visualization" && (
          <div className="gc-card" style={{ padding:32, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🎨</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>Symbology Configuration</div>
            <div style={{ fontSize:12, color:"var(--c-text-3)", marginBottom:20 }}>Configure renderer, colors, labels, and pop-ups for this layer.</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="gc-btn gc-btn-primary gc-btn-sm">Configure Styles</button>
              <button className="gc-btn gc-btn-default gc-btn-sm">Edit Pop-ups</button>
              <button className="gc-btn gc-btn-default gc-btn-sm">Configure Labels</button>
            </div>
          </div>
        )}

        {/* ── USAGE ── */}
        {tab === "usage" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="gc-card" style={{ padding:18 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Usage Statistics — Last 30 days</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {[["Views","142"],["API Requests","1,024"],["Downloads","8"],["Map Opens","37"]].map(([k,v]) => (
                  <div key={k} style={{ background:"var(--c-surface-2)", border:"1px solid var(--c-border-light)", borderRadius:8, padding:16, textAlign:"center" }}>
                    <div style={{ fontSize:26, fontWeight:700, color:"var(--c-blue)" }}>{v}</div>
                    <div style={{ fontSize:11, color:"var(--c-text-3)", marginTop:4 }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:600 }}>
            <div className="gc-card" style={{ padding:18 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Item Details</div>
              {[["Title","Niger Delta Asset Survey"],["Summary","Point feature layer for field survey data collection."],["Description","Hosted feature layer containing survey points collected in the Niger Delta region."]].map(([lbl,val]) => (
                <div key={lbl} className="gc-prop-row">
                  <label>{lbl}</label>
                  <input className="gc-prop-input" defaultValue={val}/>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:12 }}>
                <button className="gc-btn gc-btn-default gc-btn-sm">Cancel</button>
                <button className="gc-btn gc-btn-primary gc-btn-sm">Save Changes</button>
              </div>
            </div>
            <div className="gc-card" style={{ padding:18, border:"1px solid #fecaca" }}>
              <div style={{ fontWeight:600, fontSize:13, color:"var(--c-danger)", marginBottom:6 }}>Danger Zone</div>
              <div style={{ fontSize:12, color:"var(--c-text-3)", marginBottom:12 }}>Permanently delete this item and all associated data. This cannot be undone.</div>
              <button className="gc-btn gc-btn-danger gc-btn-sm" style={{ gap:5 }}><Trash2 size={12}/> Delete Item</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
