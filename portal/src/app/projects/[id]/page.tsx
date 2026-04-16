// portal/src/app/projects/[id]/page.tsx
// Project dashboard: Map Viewer, Attribute Table, Dashboard Widgets, Download Centre.
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import AttributeTable from '@/components/AttributeTable';
import WidgetGrid from '@/components/WidgetGrid';
import DownloadCentre from '@/components/DownloadCentre';

// MapLibre must be client-only (no SSR)
const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

type Tab = 'map' | 'table' | 'widgets' | 'download';

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const [features, setFeatures] = useState<GeoJSON.FeatureCollection | null>(null);
  const [config, setConfig]     = useState<any>(null);
  const [tab, setTab]           = useState<Tab>('map');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProjectFeatures(id),
      api.getPortalConfig(id),
    ]).then(([fc, cfg]) => {
      setFeatures(fc);
      setConfig(cfg);
    }).finally(() => setLoading(false));
  }, [id]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'map',      label: 'Map' },
    { key: 'table',    label: 'Attribute Table' },
    { key: 'widgets',  label: 'Dashboard' },
    { key: 'download', label: 'Download' },
  ];

  return (
    <main className="flex flex-col h-screen">
      {/* Tab bar */}
      <nav className="flex gap-1 px-6 pt-4 border-b bg-white">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-t font-medium transition-colors
              ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Panel */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading...</div>
        ) : (
          <>
            {tab === 'map'      && <MapViewer features={features} />}
            {tab === 'table'    && <AttributeTable features={features?.features ?? []} />}
            {tab === 'widgets'  && <WidgetGrid config={config} features={features?.features ?? []} projectId={id} />}
            {tab === 'download' && <DownloadCentre projectId={id} />}
          </>
        )}
      </div>
    </main>
  );
}
