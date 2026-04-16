// portal/src/lib/mapStyles.ts
// Auto-generate MapLibre layer styles from geometry_type.

export function layerStyleFromGeometryType(geometryType: string, color = '#3b82f6') {
  switch (geometryType) {
    case 'Point':
      return {
        type: 'circle' as const,
        paint: {
          'circle-radius': 6,
          'circle-color': color,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fff',
        },
      };
    case 'LineString':
      return {
        type: 'line' as const,
        paint: { 'line-color': color, 'line-width': 2.5 },
      };
    case 'Polygon':
    case 'Multi':
      return {
        type: 'fill' as const,
        paint: { 'fill-color': color, 'fill-opacity': 0.35, 'fill-outline-color': color },
      };
    default:
      return { type: 'circle' as const, paint: { 'circle-radius': 5, 'circle-color': color } };
  }
}

export const LAYER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];
