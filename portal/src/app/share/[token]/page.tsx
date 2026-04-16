// portal/src/app/share/[token]/page.tsx
// Public share view — read-only map + attribute table, no login required.
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import AttributeTable from '@/components/AttributeTable';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData]     = useState<any>(null);
  const [tab, setTab]       = useState<'map' | 'table'>('map');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getShareForm(token)
      .then(setData)
      .catch(() => setError('This share link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex items-center justify-center h-screen text-sm text-gray-400">Loading...</div>;
  if (error)   return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

  const features: GeoJSON.Feature[] = (data?.features || []).map((f: any) => ({
    type: 'Feature', id: f.id, geometry: f.geometry,
    properties: { ...f.attributes, _created_at: f.created_at }
  }));

  const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };

  return (
    <main className="flex flex-col h-screen">
      <header className="px-6 py-3 border-b bg-white flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-900">{data.name}</h1>
          <p className="text-xs text-gray-400">{features.length} features · Read-only</p>
        </div>
        <div className="flex gap-1">
          {(['map', 'table'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded font-medium
                ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t === 'map' ? 'Map' : 'Table'}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {tab === 'map'   && <MapViewer features={fc} />}
        {tab === 'table' && <AttributeTable features={features} />}
      </div>
    </main>
  );
}
