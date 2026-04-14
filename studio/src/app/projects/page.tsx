// studio/src/app/projects/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, ArrowLeft, FileText, Users, Globe, Lock,
  Building2, Copy, Check, ExternalLink, Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Project, FormSchema } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface ProjectDetail extends Project {
  members: Member[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FIELD_URL = process.env.NEXT_PUBLIC_FIELD_URL || "https://geocollect-field.onrender.com";

function visibilityBadge(v: string) {
  if (v === "public")       return { icon: Globe,     label: "Public",       cls: "badge-green"  };
  if (v === "organization") return { icon: Building2, label: "Organization", cls: "badge-blue"   };
  return                           { icon: Lock,      label: "Private",      cls: "badge-slate"  };
}

// ─── Form Card ────────────────────────────────────────────────────────────────

function FormCard({
  form,
  onDelete,
}: {
  form: FormSchema & { share_token?: string | null; visibility?: string; geofences?: unknown[] };
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const vis     = visibilityBadge(form.visibility || "private");
  const VisIcon = vis.icon;
  const zones   = form.geofences?.length ?? 0;
  const shareUrl = form.share_token && form.visibility !== "private"
    ? `${FIELD_URL}/s/${form.share_token}`
    : null;

  const copyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    await api.delete(`/forms/${form.id}`);
    onDelete(form.id);
  };

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/projects/${form.project_id}/forms/${form.id}`}
            className="font-semibold text-slate-800 hover:text-primary transition-colors truncate block"
          >
            {form.name}
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">
            v{form.version} · {form.geometry_type} · {form.schema?.fields?.length ?? 0} fields
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Visibility badge */}
          <span className={`badge ${vis.cls} gap-1`}>
            <VisIcon size={10} />
            {vis.label}
          </span>
          {/* Published badge */}
          {form.is_published
            ? <span className="badge badge-green">Published</span>
            : <span className="badge badge-slate">Draft</span>}
        </div>
      </div>

      {/* Geofence zones summary */}
      {zones > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="text-blue-500">⬡</span>
          {zones} geofence zone{zones !== 1 ? "s" : ""}
        </div>
      )}

      {/* Share link row */}
      {shareUrl && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-xs text-slate-500 font-mono flex-1 truncate">{shareUrl}</span>
          <button
            onClick={copyLink}
            className="btn btn-ghost btn-xs shrink-0 gap-1"
            title="Copy share link"
          >
            {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-xs shrink-0"
            title="Open form"
          >
            <ExternalLink size={11} />
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          className="btn btn-secondary btn-sm flex-1 justify-center"
          onClick={() => router.push(`/projects/${form.project_id}/forms/${form.id}`)}
        >
          Edit Form
        </button>
        <button
          className="btn btn-ghost btn-sm text-red-400 hover:text-red-600 hover:bg-red-50"
          onClick={handleDelete}
          title="Delete form"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({
  projectId,
  onClose,
  onAdded,
}: {
  projectId: string;
  onClose: () => void;
  onAdded: (m: Member) => void;
}) {
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState("field_collector");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      // Look up user by email first
      const users = await api.get<{ id: string; email: string; full_name: string }[]>(
        `/users?email=${encodeURIComponent(email)}`
      );
      if (!users || users.length === 0) {
        setError("No user found with that email. They must register first."); return;
      }
      const user = users[0];
      await api.post(`/projects/${projectId}/members`, { user_id: user.id, role });
      onAdded({ id: user.id, email: user.email, full_name: user.full_name, role });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-slate-800 text-lg mb-5">Add Team Member</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" required placeholder="worker@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="field_collector">Field Collector</option>
              <option value="project_manager">Project Manager</option>
              <option value="gis_analyst">GIS Analyst</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Adding…" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [forms, setForms]     = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState<"forms" | "members">("forms");

  useEffect(() => {
    Promise.all([
      api.get<ProjectDetail>(`/projects/${id}`),
      api.get<FormSchema[]>(`/projects/${id}/forms`),
    ])
      .then(([proj, fms]) => { setProject(proj); setForms(fms); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-7 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-48" />
          <div className="h-4 bg-slate-100 rounded w-64" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!project) return <div className="p-7 text-slate-500">Project not found.</div>;

  return (
    <div className="p-7 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/projects" className="hover:text-slate-700 flex items-center gap-1">
          <ArrowLeft size={13} /> Projects
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{project.name}</span>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.description || "No description"}</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "forms" && (
            <Link href={`/projects/${id}/forms/new`} className="btn btn-primary">
              <Plus size={15} /> New Form
            </Link>
          )}
          {activeTab === "members" && (
            <button className="btn btn-primary" onClick={() => setShowAddMember(true)}>
              <Plus size={15} /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600"><FileText size={16} /></div>
          <p className="stat-value">{forms.length}</p>
          <p className="stat-label">Forms</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 text-emerald-600"><Globe size={16} /></div>
          <p className="stat-value">{forms.filter(f => f.is_published).length}</p>
          <p className="stat-label">Published</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-violet-100 text-violet-600"><Users size={16} /></div>
          <p className="stat-value">{project.members?.length ?? 0}</p>
          <p className="stat-label">Members</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        <button className={`tab-item ${activeTab === "forms" ? "active" : ""}`} onClick={() => setActiveTab("forms")}>
          <FileText size={14} /> Forms ({forms.length})
        </button>
        <button className={`tab-item ${activeTab === "members" ? "active" : ""}`} onClick={() => setActiveTab("members")}>
          <Users size={14} /> Members ({project.members?.length ?? 0})
        </button>
      </div>

      {/* Forms tab */}
      {activeTab === "forms" && (
        forms.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={22} /></div>
              <p className="font-semibold text-slate-700 mb-1">No forms yet</p>
              <p className="text-sm mb-4">Create your first form to start collecting data.</p>
              <Link href={`/projects/${id}/forms/new`} className="btn btn-primary btn-sm">
                <Plus size={13} /> Create Form
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {forms.map(f => (
              <FormCard
                key={f.id}
                form={f as FormSchema & { share_token?: string | null; visibility?: string; geofences?: unknown[] }}
                onDelete={id => setForms(prev => prev.filter(x => x.id !== id))}
              />
            ))}
          </div>
        )
      )}

      {/* Members tab */}
      {activeTab === "members" && (
        <div className="card divide-y divide-slate-100">
          {(project.members || []).map(m => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                {m.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{m.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{m.email}</p>
              </div>
              <span className="badge badge-blue capitalize">{m.role.replace(/_/g, " ")}</span>
            </div>
          ))}
          {(project.members || []).length === 0 && (
            <div className="empty-state py-10">
              <div className="empty-state-icon"><Users size={20} /></div>
              <p className="text-sm font-medium text-slate-600 mb-1">No members yet</p>
              <p className="text-xs text-slate-400">Add team members to collaborate on this project.</p>
            </div>
          )}
        </div>
      )}

      {/* Add member modal */}
      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={m => { setProject(p => p ? { ...p, members: [...(p.members || []), m] } : p); setShowAddMember(false); }}
        />
      )}
    </div>
  );
}
