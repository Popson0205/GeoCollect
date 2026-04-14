// studio/src/app/projects/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FolderKanban,
  FileText,
  Users,
  ArrowRight,
  Archive,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Project } from "@/types";

type Filter = "all" | "active" | "archived";

function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const p = await api.post<Project>("/projects", {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onCreated(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 text-lg mb-5">New Project</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input
              className="input"
              placeholder="e.g. Urban Tree Survey 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="What will this project collect?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn-primary btn-sm"
            >
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api
      .get<Project[]>("/projects")
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "active" && p.status === "active") ||
      (filter === "archived" && p.status === "archived");
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-7 max-w-5xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in your
            workspace
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus size={15} />
          New Project
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            className="input pl-8"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
          {(["all", "active", "archived"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-1" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              {search ? (
                <Search size={22} />
              ) : (
                <FolderKanban size={22} />
              )}
            </div>
            <p className="font-semibold text-slate-700 mb-1">
              {search ? "No matching projects" : "No projects yet"}
            </p>
            <p className="text-sm mb-4">
              {search
                ? "Try a different search term."
                : "Create your first project to get started."}
            </p>
            {!search && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary btn-sm"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="card-hover p-5 block group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {p.status === "archived" && (
                      <Archive size={12} className="text-slate-400 shrink-0" />
                    )}
                    <h3 className="font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {p.description || "No description"}
                  </p>
                </div>
                <span
                  className={`badge shrink-0 ${
                    p.status === "active" ? "badge-green" : "badge-slate"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText size={11} />
                    {p.form_count || 0} forms
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {p.member_count || 0} members
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-300 group-hover:text-primary transition-colors"
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(p) => {
            setProjects((prev) => [p, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
