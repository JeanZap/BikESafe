import type { LngLat } from '@/services/osrm';

const M_PER_DEG_LAT = 110_540;

/** Converte para metros num plano local centrado em `ref` (bom para poucos km). */
function toXY(p: LngLat, ref: LngLat): [number, number] {
  const mPerDegLng = 111_320 * Math.cos((ref[1] * Math.PI) / 180);
  return [(p[0] - ref[0]) * mPerDegLng, (p[1] - ref[1]) * M_PER_DEG_LAT];
}

export type RouteProjection = {
  /** Índice do segmento [i, i+1] mais próximo. */
  segment: number;
  /** Ponto da rota mais próximo do usuário. */
  point: LngLat;
  /** Distância do usuário até a rota, em metros. */
  offsetM: number;
};

/** Ponto da linha mais próximo de `p`. */
export function projectOnRoute(coords: LngLat[], p: LngLat): RouteProjection {
  let best: RouteProjection = { segment: 0, point: coords[0], offsetM: Infinity };
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const [bx, by] = toXY(b, a);
    const [px, py] = toXY(p, a);
    const len2 = bx * bx + by * by;
    const t = len2 ? Math.max(0, Math.min(1, (px * bx + py * by) / len2)) : 0;
    const dx = px - bx * t;
    const dy = py - by * t;
    const d = Math.hypot(dx, dy);
    if (d < best.offsetM) {
      best = {
        segment: i,
        point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        offsetM: d,
      };
    }
  }
  return best;
}

/** Comprimento de uma linha em metros. */
export function lineLengthM(coords: LngLat[]) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [x, y] = toXY(coords[i], coords[i - 1]);
    total += Math.hypot(x, y);
  }
  return total;
}

/** Trecho da rota que ainda falta, a partir da projeção do usuário. */
export function remainingCoords(coords: LngLat[], projection: RouteProjection): LngLat[] {
  return [projection.point, ...coords.slice(projection.segment + 1)];
}
