"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const router = useRouter();

  const load = () => api.get<Project[]>("/projects").then(setProjects);
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = await api.post<Project>("/projects", form);
    setShowNew(false); setForm({ name: "", description: "" });
    router.push(`/projects/${p.id}`);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ New Project</button>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-4">New Project</h2>
            <form onSubmit={create} className="space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input className="input" required placeholder="My Survey Project"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} placeholder="What data are you collecting?"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {projects.map(p => (
          <Link key={p.id} href={`/projects/${p.id}`} className="card p-5 hover:shadow-md transition-shadow block">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-slate-800">{p.name}</h3>
              <span className={`badge ${p.status === "active" ? "badge-green" : "badge-orange"}`}>{p.status}</span>
            </div>
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{p.description || "No description"}</p>
            <div className="flex gap-4 mt-4 text-xs text-slate-400">
              <span>📋 {p.form_count || 0} forms</span>
              <span>👥 {p.member_count || 0} members</span>
              <span>{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
