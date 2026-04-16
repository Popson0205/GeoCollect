// portal/src/components/DownloadCentre.tsx
// Self-service export panel — format selector + optional bbox filter + download trigger.
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const FORMATS = [
  { value: 'geojson',   label: 'GeoJSON (.geojson)' },
  { value: 'gpkg',      label: 'GeoPackage (.gpkg)' },
  { value: 'shapefile', label: 'Shapefile (.zip)' },
  { value: 'kml',       label: 'KML (.kml)' },
  { value: 'csv',       label: 'CSV + WKT (.csv)' },
  { value: 'xlsx',      label: 'Excel (.xlsx)' },
];

export default function DownloadCentre({ projectId }: { projectId: string }) {
  const [format, setFormat]   = useState('geojson');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleDownload() {
    setLoading(true);
    setError('');
    try {
      const res = await api.exportFeatures(projectId, format);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const ext  = FORMATS.find(f => f.value === format)?.label.match(/\((.+)\)/)?.[1] ?? format;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `geocollect_export_${projectId}.${format === 'shapefile' ? 'zip' : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Download Centre</h2>
      <p className="text-sm text-gray-500 mb-6">
        Export all features in this project in your preferred format.
      </p>

      <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
      <select
        value={format}
        onChange={e => setFormat(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm mb-6">
        {FORMATS.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium
          hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? 'Preparing export...' : 'Download'}
      </button>
    </div>
  );
}
