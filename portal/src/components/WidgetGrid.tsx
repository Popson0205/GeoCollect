// portal/src/components/WidgetGrid.tsx
// Dashboard widget container — renders configured widgets for a project.
'use client';

import CountWidget from './widgets/CountWidget';
import SumWidget from './widgets/SumWidget';
import ChartWidget from './widgets/ChartWidget';
import MapWidget from './widgets/MapWidget';

interface Widget {
  id: string; type: 'count' | 'sum' | 'chart' | 'map';
  title: string; field?: string; chartType?: 'bar' | 'pie'; formId?: string;
}

interface Props {
  config: { widgets: Widget[] } | null;
  features: GeoJSON.Feature[];
  projectId: string;
}

export default function WidgetGrid({ config, features, projectId }: Props) {
  const widgets: Widget[] = config?.widgets ?? [];

  if (!widgets.length) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        No dashboard widgets configured. Add widgets from Studio → Portal Management.
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
      {widgets.map(w => {
        switch (w.type) {
          case 'count': return <CountWidget key={w.id} title={w.title} features={features} field={w.field} />;
          case 'sum':   return <SumWidget   key={w.id} title={w.title} features={features} field={w.field!} />;
          case 'chart': return <ChartWidget key={w.id} title={w.title} features={features} field={w.field!} chartType={w.chartType ?? 'bar'} />;
          case 'map':   return <MapWidget   key={w.id} title={w.title} features={features} />;
          default:      return null;
        }
      })}
    </div>
  );
}
