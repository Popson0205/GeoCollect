"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project, FormSchema } from "@/types";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.get<Project>(`/projects/${id}`).then(setProject);
    api.get<FormSchema[]>(`/projects/${id}/forms`).then(setForms);
  }, [id]);

  if (!project) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <Link href="/projects" className="hover:text-primary">Projects</Link>
        <span>/</span>
        <span className="text-slate-700">{project.name}</span>
      </div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
          <p className="text-slate-500 mt-1">{project.description}</p>
        </div>
        <Link href={`/projects/${id}/forms/new`} className="btn-primary">+ New Form</Link>
      </div>

      <h2 className="font-semibold text-slate-700 mb-3">Forms ({forms.length})</h2>
      {forms.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">No forms yet</p>
          <p className="text-sm mt-1">Create your first form to start collecting data</p>
          <Link href={`/projects/${id}/forms/new`} className="btn-primary mt-4 inline-flex">Create Form</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {forms.map(f => (
            <div key={f.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{f.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">v{f.version} · {f.geometry_type} · {f.schema?.fields?.length || 0} fields</p>
                </div>
                <span className={`badge ${f.is_published ? "badge-green" : "badge-orange"}`}>
                  {f.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Link href={`/projects/${id}/forms/${f.id}`} className="btn-primary text-xs px-3 py-1.5">Edit</Link>
                {!f.is_published && (
                  <button onClick={async () => {
                    await api.post(`/forms/${f.id}/publish`, {});
                    api.get<FormSchema[]>(`/projects/${id}/forms`).then(setForms);
                  }} className="btn-ghost text-xs px-3 py-1.5 text-geo-green border border-geo-green/30 hover:bg-green-50">
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
