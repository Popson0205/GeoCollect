// portal/src/components/MapViewer.tsx
// MapLibre GL map — renders a GeoJSON FeatureCollection.
// Auto-styles layers by geometry type. Click feature → attribute popup.
'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { layerStyleFromGeometryType, LAYER_COLORS } from '@/lib/mapStyles';

interface Props {
  features: GeoJSON.FeatureCollection | null;
}

export default function MapViewer({ features }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [0, 20],
      zoom: 2,
    });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !features?.features?.length) return;

    const onLoad = () => {
      // Group features by geometry type
      const byType: Record<string, GeoJSON.Feature[]> = {};
      for (const f of features.features) {
        const t = f.geometry?.type || 'Point';
        (byType[t] = byType[t] || []).push(f);
      }

      let colorIdx = 0;
      for (const [geomType, feats] of Object.entries(byType)) {
        const sourceId = `gc-${geomType.toLowerCase()}`;
        const layerId  = `gc-layer-${geomType.toLowerCase()}`;
        const color    = LAYER_COLORS[colorIdx++ % LAYER_COLORS.length];
        const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: feats };

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, { type: 'geojson', data: fc });
          const style = layerStyleFromGeometryType(geomType, color);
          map.addLayer({ id: layerId, source: sourceId, ...style } as any);

          // Click popup
          map.on('click', layerId, (e) => {
            const props = e.features?.[0]?.properties || {};
            const html  = Object.entries(props)
              .filter(([k]) => !k.startsWith('_'))
              .map(([k, v]) => `<div><strong>${k}</strong>: ${v}</div>`)
              .join('');
            new maplibregl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`<div class="text-xs space-y-1">${html || 'No attributes'}</div>`)
              .addTo(map);
          });
          map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
        }
      }

      // Fit bounds
      const coords = features.features
        .map(f => {
          const g = f.geometry as any;
          return g?.type === 'Point' ? [g.coordinates] : g?.coordinates?.flat(3) ?? [];
        })
        .flat();
      if (coords.length) {
        const lngs = coords.map((c: number[]) => c[0]);
        const lats = coords.map((c: number[]) => c[1]);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 60, maxZoom: 14 }
        );
      }
    };

    if (map.isStyleLoaded()) onLoad();
    else map.on('load', onLoad);
  }, [features]);

  return <div ref={containerRef} className="w-full h-full" />;
}
