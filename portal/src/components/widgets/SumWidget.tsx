'use client';
interface Props { title: string; features: GeoJSON.Feature[]; field: string; }
export default function SumWidget({ title, features, field }: Props) {
  const sum = features.reduce((acc, f) => acc + (Number(f.properties?.[field]) || 0), 0);
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-4xl font-bold text-gray-900 mt-2">{sum.toLocaleString()}</p>
      <p className="text-xs text-gray-400 mt-1">Sum of {field}</p>
    </div>
  );
}
