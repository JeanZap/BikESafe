import type { AlertType } from '@/constants/alerts';
import type { LngLat } from '@/services/osrm';
import { freshness } from '@/services/route-safety';
import type { Annotation } from '@/store/annotations-store';

/**
 * "Mapa de calor" ao longo de uma rota: cada trecho vai da cor normal da rota
 * até o vermelho conforme a proximidade de alertas (acidentes, buracos,
 * trechos escuros).
 *
 * Heurística: amostramos a linha a cada ~20 m e somamos, para cada amostra, a
 * intensidade de cada alerta multiplicada por um núcleo gaussiano da distância.
 * O resultado vira um `line-gradient` do MapLibre (exige `lineMetrics` na fonte).
 */

export const M_PER_DEG_LAT = 111_320;

/** Espaçamento desejado entre amostras (m). */
const SAMPLE_STEP_M = 20;
/** Limite de amostras, para rotas longas não gerarem expressões enormes. */
const MAX_SAMPLES = 240;
/** Largura do "calor" em volta de cada alerta (desvio padrão, m). */
const SIGMA_M = 45;
/** Acima disso o alerta é ignorado (≈ 3σ). */
export const CUTOFF_M = SIGMA_M * 3;
/** Risco a partir do qual o trecho fica totalmente vermelho. */
const FULL_RED_RISK = 1;

/**
 * Intensidade visual de cada tipo. Difere dos pesos de `route-safety` (que
 * escolhem a rota): aqui um buraco precisa aparecer, mesmo pesando pouco lá.
 */
const INTENSITY: Record<AlertType, number> = {
  accident: 1,
  noLight: 0.8,
  pothole: 0.45,
  bikeLane: 0,
};

export type HazardPoint = { point: LngLat; weight: number };

/** Alertas que geram "calor", já com a intensidade (tipo × frescor). */
export function hazardPoints(annotations: Annotation[], now = Date.now()): HazardPoint[] {
  return annotations
    .map((a) => ({ point: a.coordinates, weight: INTENSITY[a.type] * freshness(a, now) }))
    .filter((h) => h.weight > 0);
}

/** Risco num ponto: soma dos alertas ponderada por um núcleo gaussiano da distância. */
export function riskAt(p: LngLat, hazards: HazardPoint[]) {
  let risk = 0;
  for (const h of hazards) {
    const dist = distanceM(p, h.point);
    if (dist > CUTOFF_M) continue;
    risk += h.weight * Math.exp(-((dist / SIGMA_M) ** 2) / 2);
  }
  return Math.min(1, risk / FULL_RED_RISK);
}

export const COLOR_MID = '#F59E0B'; // âmbar
export const COLOR_HIGH = '#EF4444'; // vermelho

/** Expressão `interpolate` sobre `line-progress`, pronta para `line-gradient`. */
export type RiskGradient = ['interpolate', ['linear'], ['line-progress'], ...(number | string)[]];

export function distanceM(a: LngLat, b: LngLat) {
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  return Math.hypot((a[0] - b[0]) * mPerDegLng, (a[1] - b[1]) * M_PER_DEG_LAT);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(from: string, to: string, t: number) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Cor do trecho: base → âmbar → vermelho, conforme o risco (0..1). */
function colorFor(level: number, baseColor: string) {
  if (level <= 0.02) return baseColor;
  if (level < 0.5) return mix(baseColor, COLOR_MID, level / 0.5);
  return mix(COLOR_MID, COLOR_HIGH, Math.min(1, (level - 0.5) / 0.5));
}

/**
 * Gera o gradiente de risco da linha. Retorna `null` quando nenhum alerta está
 * perto o bastante — aí basta usar a cor sólida da rota.
 */
export function buildRiskGradient(
  coords: LngLat[],
  annotations: Annotation[],
  baseColor: string
): RiskGradient | null {
  if (coords.length < 2) return null;

  const hazards = hazardPoints(annotations);
  if (hazards.length === 0) return null;

  // Distância acumulada em cada vértice.
  const cumulative = [0];
  for (let i = 1; i < coords.length; i++) {
    cumulative.push(cumulative[i - 1] + distanceM(coords[i - 1], coords[i]));
  }
  const total = cumulative[cumulative.length - 1];
  if (total <= 0) return null;

  // Descarta alertas longe de toda a rota (caixa envolvente + folga).
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const padLat = CUTOFF_M / M_PER_DEG_LAT;
  const padLng = CUTOFF_M / (M_PER_DEG_LAT * Math.cos((minLat * Math.PI) / 180));
  const nearby = hazards.filter(
    ({ point: [lng, lat] }) =>
      lng >= minLng - padLng &&
      lng <= maxLng + padLng &&
      lat >= minLat - padLat &&
      lat <= maxLat + padLat
  );
  if (nearby.length === 0) return null;

  const samples = Math.min(MAX_SAMPLES, Math.max(2, Math.ceil(total / SAMPLE_STEP_M) + 1));
  const levels: number[] = [];
  let segment = 1;
  let peak = 0;

  for (let s = 0; s < samples; s++) {
    const d = (total * s) / (samples - 1);
    while (segment < coords.length - 1 && cumulative[segment] < d) segment++;
    const a = coords[segment - 1];
    const b = coords[segment];
    const segLen = cumulative[segment] - cumulative[segment - 1];
    const t = segLen > 0 ? (d - cumulative[segment - 1]) / segLen : 0;
    const p: LngLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

    const level = riskAt(p, nearby);
    levels.push(level);
    if (level > peak) peak = level;
  }
  if (peak <= 0.02) return null;

  // Monta as paradas, pulando amostras cuja cor é igual à vizinha dos dois lados.
  const stops: (number | string)[] = [];
  const colors = levels.map((l) => colorFor(l, baseColor));
  for (let i = 0; i < samples; i++) {
    const isEdge = i === 0 || i === samples - 1;
    if (!isEdge && colors[i] === colors[i - 1] && colors[i] === colors[i + 1]) continue;
    stops.push(i / (samples - 1), colors[i]);
  }

  return ['interpolate', ['linear'], ['line-progress'], ...stops];
}
