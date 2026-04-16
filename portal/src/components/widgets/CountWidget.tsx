'use client';
interface Props { title: string; features: GeoJSON.Feature[]; field?: string; }
export default function CountWidget({ title, features, field }: Props) {
  const count = field
    ? features.filter(f => f.properties?.[field] != null).length
    : features.length;
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-4xl font-bold text-gray-900 mt-2">{count.toLocaleString()}</p>
    </div>
  );
}
