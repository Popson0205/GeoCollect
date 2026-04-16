// portal/src/app/projects/page.tsx
// Project catalog — server component, lists all accessible projects.
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading projects...</div>;

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Projects</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <Link key={p.id} href={`/projects/${p.id}`}
            className="block border rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
            <h2 className="font-medium text-gray-900">{p.name}</h2>
            {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span>{Number(p.feature_count).toLocaleString()} features</span>
              {p.last_submission && (
                <span>Last: {new Date(p.last_submission).toLocaleDateString()}</span>
              )}
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="col-span-3 text-gray-400 text-sm">No projects found.</p>
        )}
      </div>
    </main>
  );
}
