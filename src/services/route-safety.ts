import type { AlertType } from '@/constants/alerts';
import type { BikeRoute, LngLat } from '@/services/osrm';
import type { Annotation } from '@/store/annotations-store';

/**
 * Pontuação de segurança de uma rota a partir das anotações do mapa.
 *
 * O OSRM não aceita "evite estes pontos", então calculamos as rotas normalmente
 * e depois contamos quais alertas ficam perto de cada linha. Quanto menor o
 * risco, mais segura a rota.
 */

/** Distância máxima (m) entre o alerta e a linha para contar como "no caminho". */
const HAZARD_RADIUS_M = 30;
/** Ciclovias são marcadas por um ponto só; aceitamos uma folga maior. */
const BIKE_LANE_RADIUS_M = 50;

/** Peso de cada tipo no risco. Negativo = deixa a rota mais segura. */
const WEIGHTS: Record<AlertType, number> = {
  accident: 1,
  pothole: 0.1,
  noLight: 1.5,
  bikeLane: -1,
};

/** Acidentes perdem peso com o tempo (meia-vida em horas). */
const ACCIDENT_HALF_LIFE_H = 12;

export type HazardType = Exclude<AlertType, 'bikeLane'>;

export type RouteSafety = {
  /** Quanto maior, mais perigosa. Pode ser negativo (muitas ciclovias). */
  risk: number;
  /** Quantidade de alertas de cada tipo no caminho. */
  counts: Record<AlertType, number>;
  /** Total de alertas perigosos (sem contar ciclovias). */
  hazardCount: number;
  /** Anotações que ficam no caminho, para mostrar no mapa. */
  nearby: Annotation[];
};

const M_PER_DEG_LAT = 111_320;

/** Distância (m) de um ponto ao segmento a–b, numa projeção plana local. */
function distanceToSegmentM(p: LngLat, a: LngLat, b: LngLat) {
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((p[1] * Math.PI) / 180);
  const ax = (a[0] - p[0]) * mPerDegLng;
  const ay = (a[1] - p[1]) * M_PER_DEG_LAT;
  const bx = (b[0] - p[0]) * mPerDegLng;
  const by = (b[1] - p[1]) * M_PER_DEG_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

function distanceToLineM(p: LngLat, coords: LngLat[]) {
  if (coords.length === 1) return distanceToSegmentM(p, coords[0], coords[0]);
  let min = Infinity;
  for (let i = 1; i < coords.length; i++) {
    const d = distanceToSegmentM(p, coords[i - 1], coords[i]);
    if (d < min) min = d;
  }
  return min;
}

/** Fator 0..1 de "frescor": acidentes perdem peso com o tempo; o resto não. */
export function freshness(annotation: Annotation, now: number) {
  if (annotation.type !== 'accident') return 1;
  const ageH = Math.max(0, (now - Date.parse(annotation.createdAt)) / 3_600_000);
  return Number.isFinite(ageH) ? 0.5 ** (ageH / ACCIDENT_HALF_LIFE_H) : 1;
}

function weightOf(annotation: Annotation, now: number) {
  return WEIGHTS[annotation.type] * freshness(annotation, now);
}

export function scoreRoute(route: BikeRoute, annotations: Annotation[]): RouteSafety {
  const coords = route.geometry.coordinates;
  const counts: Record<AlertType, number> = { pothole: 0, accident: 0, bikeLane: 0, noLight: 0 };
  const nearby: Annotation[] = [];
  const now = Date.now();
  let risk = 0;

  for (const a of annotations) {
    const radius = a.type === 'bikeLane' ? BIKE_LANE_RADIUS_M : HAZARD_RADIUS_M;
    if (distanceToLineM(a.coordinates, coords) > radius) continue;
    counts[a.type] += 1;
    risk += weightOf(a, now);
    nearby.push(a);
  }

  return {
    risk,
    counts,
    hazardCount: counts.accident + counts.pothole + counts.noLight,
    nearby,
  };
}

const HAZARD_LABELS: Record<HazardType, [singular: string, plural: string]> = {
  accident: ['acidente', 'acidentes'],
  pothole: ['buraco', 'buracos'],
  noLight: ['trecho escuro', 'trechos escuros'],
};

/** Resumo curto para o card da rota, ex.: "1 acidente · 2 buracos". */
export function describeSafety(safety: RouteSafety) {
  const parts = (Object.keys(HAZARD_LABELS) as HazardType[])
    .filter((t) => safety.counts[t] > 0)
    .map((t) => {
      const n = safety.counts[t];
      return `${n} ${HAZARD_LABELS[t][n === 1 ? 0 : 1]}`;
    });
  if (parts.length === 0) parts.push('Sem alertas no caminho');
  if (safety.counts.bikeLane > 0) parts.push('ciclovia');
  return parts.join(' · ');
}
