import STREETS from '@/data/vitoria-streets.json';
import type { LngLat } from '@/services/osrm';
import {
  CUTOFF_M,
  distanceM,
  type HazardPoint,
  hazardPoints,
  M_PER_DEG_LAT,
  riskAt,
} from '@/services/route-heat';
import type { Annotation } from '@/store/annotations-store';

/**
 * Mapa de calor das ruas de Vitória: cada trecho de ~20 m perto de alertas
 * recebe um `risk` (0..1) com a mesma heurística do gradiente das rotas.
 * Só os trechos com risco aparecem; o resto do mapa fica com a cor original.
 *
 * A malha vem de `scripts/fetch-streets.mjs` (OpenStreetMap, embutida no app).
 */

/** Tamanho máximo de cada pedaço colorido (m). */
const PIECE_M = 20;
/** Abaixo disso o trecho nem vira feição. */
const MIN_RISK = 0.04;

type Way = { coords: LngLat[]; minLng: number; minLat: number; maxLng: number; maxLat: number };

let ways: Way[] | null = null;

/** Converte as listas planas do JSON em vias com caixa envolvente (uma vez só). */
function loadWays(): Way[] {
  if (ways) return ways;
  ways = (STREETS.ways as number[][]).map((flat) => {
    const coords: LngLat[] = [];
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (let i = 0; i < flat.length; i += 2) {
      const lng = flat[i];
      const lat = flat[i + 1];
      coords.push([lng, lat]);
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return { coords, minLng, minLat, maxLng, maxLat };
  });
  return ways;
}

type Box = { minLng: number; minLat: number; maxLng: number; maxLat: number };

const intersects = (a: Box, b: Box) =>
  a.minLng <= b.maxLng && a.maxLng >= b.minLng && a.minLat <= b.maxLat && a.maxLat >= b.minLat;

/** Caixa de alcance de um alerta (raio de corte do núcleo). */
function reachBox([lng, lat]: LngLat): Box {
  const dLat = CUTOFF_M / M_PER_DEG_LAT;
  const dLng = CUTOFF_M / (M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  return { minLng: lng - dLng, maxLng: lng + dLng, minLat: lat - dLat, maxLat: lat + dLat };
}

export type StreetHeatProperties = { risk: number };

export function buildStreetHeat(
  annotations: Annotation[]
): GeoJSON.FeatureCollection<GeoJSON.LineString, StreetHeatProperties> {
  const hazards = hazardPoints(annotations);
  const features: GeoJSON.Feature<GeoJSON.LineString, StreetHeatProperties>[] = [];
  if (hazards.length === 0) return { type: 'FeatureCollection', features };

  const reaches = hazards.map((h) => ({ hazard: h, box: reachBox(h.point) }));

  for (const way of loadWays()) {
    const near: HazardPoint[] = [];
    const boxes: Box[] = [];
    for (const r of reaches) {
      if (intersects(way, r.box)) {
        near.push(r.hazard);
        boxes.push(r.box);
      }
    }
    if (near.length === 0) continue;

    for (let i = 1; i < way.coords.length; i++) {
      const a = way.coords[i - 1];
      const b = way.coords[i];
      const seg: Box = {
        minLng: Math.min(a[0], b[0]),
        maxLng: Math.max(a[0], b[0]),
        minLat: Math.min(a[1], b[1]),
        maxLat: Math.max(a[1], b[1]),
      };
      if (!boxes.some((box) => intersects(seg, box))) continue;

      const pieces = Math.max(1, Math.ceil(distanceM(a, b) / PIECE_M));
      let prev = a;
      for (let k = 1; k <= pieces; k++) {
        const t = k / pieces;
        const next: LngLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const mid: LngLat = [(prev[0] + next[0]) / 2, (prev[1] + next[1]) / 2];
        const risk = riskAt(mid, near);
        if (risk >= MIN_RISK) {
          features.push({
            type: 'Feature',
            properties: { risk: Math.round(risk * 100) / 100 },
            geometry: { type: 'LineString', coordinates: [prev, next] },
          });
        }
        prev = next;
      }
    }
  }

  return { type: 'FeatureCollection', features };
}
