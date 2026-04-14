"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project } from "@/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<{full_name: string; role: string} | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("gc_user");
    if (u) setUser(JSON.parse(u));
    api.get<Project[]>("/projects").then(setProjects).catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Welcome back{user ? `, ${user.full_name.split(" ")[0]}` : ""}</h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening across your projects.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Projects</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{projects.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Forms</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{projects.reduce((a, p) => a + (Number(p.form_count) || 0), 0)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Role</p>
          <p className="text-sm font-semibold text-primary mt-2 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700">Recent Projects</h2>
        <Link href="/projects" className="btn-primary text-xs px-3 py-1.5">+ New Project</Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {projects.slice(0, 4).map(p => (
          <Link key={p.id} href={`/projects/${p.id}`} className="card p-5 hover:shadow-md transition-shadow block">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description || "No description"}</p>
              </div>
              <span className={`badge ${p.status === "active" ? "badge-green" : "badge-orange"} ml-2`}>{p.status}</span>
            </div>
            <div className="flex gap-4 mt-4 text-xs text-slate-400">
              <span>{p.form_count || 0} forms</span>
              <span>{p.member_count || 0} members</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
