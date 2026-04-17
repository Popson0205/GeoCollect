// ── Forms List (/forms) ───────────────────────────────────
"use client";
import { useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Plus, Search, Eye, Edit, MoreHorizontal } from "lucide-react";

const FORMS = [
  { id:"f1", name:"Niger Delta Asset Survey",  project:"Niger Delta Power Holding", fields:12, responses:48, published:true,  modified:"Apr 15, 2026" },
  { id:"f2", name:"NCFRMI Field Survey",        project:"NCFRMI",                    fields:8,  responses:24, published:true,  modified:"Apr 12, 2026" },
  { id:"f3", name:"GIS Day Registration",       project:"GIS Day 2025",              fields:5,  responses:120,published:false, modified:"Apr 10, 2026" },
  { id:"f4", name:"Road Condition Survey",      project:"Infrastructure",            fields:10, responses:0,  published:false, modified:"Apr 8, 2026"  },
];

export default function FormsPage() {
  const [q, setQ] = useState("");
  const filtered = FORMS.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="gc-page" style={{ height:"100vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <TopNav/>
      <div className="gc-toolbar">
        <div style={{ fontWeight:600, fontSize:15 }}>Forms</div>
        <div style={{ flex:1 }}/>
        <div className="gc-search" style={{ maxWidth:260 }}>
          <Search size={13}/>
          <input className="gc-input" placeholder="Search forms…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <Link href="/forms/new" className="gc-btn gc-btn-primary gc-btn-sm" style={{ gap:5 }}>
          <Plus size={13}/> New Form
        </Link>
      </div>
      <div className="gc-table-wrap" style={{ flex:1, overflowY:"auto", paddingTop:12 }}>
        <table className="gc-table">
          <thead><tr><th>Form Name</th><th>Project</th><th>Fields</th><th>Responses</th><th>Status</th><th>Modified</th><th></th></tr></thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id}>
                <td><Link href={`/forms/${f.id}`} style={{ fontWeight:500, color:"var(--c-link)" }}>{f.name}</Link></td>
                <td style={{ fontSize:12, color:"var(--c-text-3)" }}>{f.project}</td>
                <td style={{ fontSize:12 }}>{f.fields}</td>
                <td style={{ fontSize:12 }}>{f.responses}</td>
                <td><span className={`gc-badge ${f.published ? "gc-badge-public" : "gc-badge-private"}`} style={{ display:"inline-flex" }}>{f.published ? "Published" : "Draft"}</span></td>
                <td style={{ fontSize:12, color:"var(--c-text-3)" }}>{f.modified}</td>
                <td>
                  <div style={{ display:"flex", gap:4 }}>
                    <Link href={`/forms/${f.id}`} className="gc-btn gc-btn-default gc-btn-xs" style={{ gap:4 }}><Eye size={11}/></Link>
                    <Link href={`/forms/new?id=${f.id}`} className="gc-btn gc-btn-default gc-btn-xs" style={{ gap:4 }}><Edit size={11}/></Link>
                    <button className="gc-btn gc-btn-ghost gc-btn-xs"><MoreHorizontal size={11}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
