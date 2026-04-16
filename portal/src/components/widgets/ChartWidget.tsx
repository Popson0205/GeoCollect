'use client';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
interface Props { title: string; features: GeoJSON.Feature[]; field: string; chartType: 'bar' | 'pie'; }
export default function ChartWidget({ title, features, field, chartType }: Props) {
  const counts: Record<string, number> = {};
  for (const f of features) {
    const val = String(f.properties?.[field] ?? 'Unknown');
    counts[val] = (counts[val] || 0) + 1;
  }
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        {chartType === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[3,3,0,0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
