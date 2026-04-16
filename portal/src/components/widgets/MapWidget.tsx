'use client';
import dynamic from 'next/dynamic';
const MapViewer = dynamic(() => import('../MapViewer'), { ssr: false });
interface Props { title: string; features: GeoJSON.Feature[]; }
export default function MapWidget({ title, features }: Props) {
  const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm" style={{ height: 240 }}>
      <p className="text-xs text-gray-500 uppercase tracking-wide px-4 pt-3 pb-1">{title}</p>
      <div className="h-48"><MapViewer features={fc} /></div>
    </div>
  );
}
