/**
 * Cálculo de rotas de bicicleta via OSRM.
 *
 * Usa o servidor público da FOSSGIS (routing.openstreetmap.de), que tem perfil
 * de bicicleta. O demo oficial (router.project-osrm.org) só calcula rotas de carro.
 *
 * Política de uso: máx. 1 requisição/s, User-Agent identificando o app e
 * atribuição "© OpenStreetMap contributors / OSRM" visível no app.
 * https://routing.openstreetmap.de/about.html
 */

/** Coordenada no formato [longitude, latitude] (padrão GeoJSON / MapLibre). */
export type LngLat = [longitude: number, latitude: number];

export type RouteGeometry = {
  type: 'LineString';
  coordinates: LngLat[];
};

export type BikeRoute = {
  geometry: RouteGeometry;
  /** Distância total em metros. */
  distanceM: number;
  /** Duração estimada em segundos. */
  durationS: number;
};

const OSRM_BASE_URL = 'https://routing.openstreetmap.de/routed-bike/route/v1/driving';
const USER_AGENT = 'BikeApp/1.0 (hackathon)';
const MIN_INTERVAL_MS = 1000;

let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function abortError() {
  const err = new Error('Aborted');
  err.name = 'AbortError';
  return err;
}

export function isAbortError(err: unknown) {
  return err instanceof Error && err.name === 'AbortError';
}

export class RouteError extends Error {}

export async function getBikeRoute(
  from: LngLat,
  to: LngLat,
  signal?: AbortSignal
): Promise<BikeRoute> {
  // Respeita o limite de 1 req/s do servidor público.
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  if (signal?.aborted) throw abortError();
  lastRequestAt = Date.now();

  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
  const url = `${OSRM_BASE_URL}/${coords}?overview=full&geometries=geojson&alternatives=false&steps=false`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new RouteError('Sem conexão com o servidor de rotas.');
  }

  if (res.status === 429) {
    throw new RouteError('Muitas requisições. Aguarde um instante e tente de novo.');
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.code !== 'Ok' || !json.routes?.length) {
    if (json?.code === 'NoRoute') {
      throw new RouteError('Não foi encontrada rota de bicicleta até esse ponto.');
    }
    throw new RouteError(json?.message ?? 'Não foi possível calcular a rota.');
  }

  const route = json.routes[0];
  return {
    geometry: route.geometry as RouteGeometry,
    distanceM: route.distance,
    durationS: route.duration,
  };
}

async function fetchRoutes(
  points: LngLat[],
  alternatives: number,
  signal?: AbortSignal
): Promise<BikeRoute[]> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  if (signal?.aborted) throw abortError();
  lastRequestAt = Date.now();

  const coords = points.map((p) => `${p[0]},${p[1]}`).join(';');
  const alt = alternatives > 0 ? `&alternatives=${alternatives}` : '&alternatives=false';
  const url = `${OSRM_BASE_URL}/${coords}?overview=full&geometries=geojson${alt}&steps=false`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new RouteError('Sem conexão com o servidor de rotas.');
  }
  if (res.status === 429) {
    throw new RouteError('Muitas requisições. Aguarde um instante e tente de novo.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.code !== 'Ok' || !json.routes?.length) {
    if (json?.code === 'NoRoute') {
      throw new RouteError('Não foi encontrada rota de bicicleta até esse ponto.');
    }
    throw new RouteError(json?.message ?? 'Não foi possível calcular a rota.');
  }
  return json.routes.map((route: { geometry: RouteGeometry; distance: number; duration: number }) => ({
    geometry: route.geometry,
    distanceM: route.distance,
    durationS: route.duration,
  }));
}

/** Duas rotas são "iguais" se distância e duração quase coincidem. */
function isSameRoute(a: BikeRoute, b: BikeRoute) {
  return (
    Math.abs(a.distanceM - b.distanceM) / Math.max(a.distanceM, 1) < 0.03 &&
    Math.abs(a.durationS - b.durationS) / Math.max(a.durationS, 1) < 0.03
  );
}

/**
 * Até `count` rotas de bicicleta diferentes entre `from` e `to`.
 * Pede alternativas ao OSRM; se vierem poucas, força desvios passando por um
 * ponto deslocado para os lados do meio do trajeto.
 */
export async function getBikeRoutes(
  from: LngLat,
  to: LngLat,
  signal?: AbortSignal,
  count = 3
): Promise<BikeRoute[]> {
  const routes = await fetchRoutes([from, to], count - 1, signal);
  const unique: BikeRoute[] = [];
  for (const r of routes) if (!unique.some((u) => isSameRoute(u, r))) unique.push(r);

  // Vetor perpendicular ao trajeto, para gerar os pontos de desvio.
  const mid: LngLat = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const offsets = [0.25, -0.25, 0.45, -0.45];

  for (const k of offsets) {
    if (unique.length >= count) break;
    const via: LngLat = [mid[0] - dy * k, mid[1] + dx * k];
    try {
      const [detour] = await fetchRoutes([from, via, to], 0, signal);
      // Descarta desvios absurdos (mais de 60% maiores que a melhor rota).
      if (detour.distanceM > unique[0].distanceM * 1.6) continue;
      if (!unique.some((u) => isSameRoute(u, detour))) unique.push(detour);
    } catch (err) {
      if (isAbortError(err)) throw err;
      // Um desvio sem rota não impede as outras opções.
    }
  }
  return unique.slice(0, count);
}

/** Ponto no meio (em distância) de uma linha — usado para o rótulo de tempo. */
export function getMidpoint(coords: LngLat[]): LngLat {
  if (coords.length < 2) return coords[0];
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let acc = 0;
  for (let i = 0; i < seg.length; i++) {
    if (acc + seg[i] >= total / 2) {
      const t = seg[i] ? (total / 2 - acc) / seg[i] : 0;
      const a = coords[i];
      const b = coords[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    acc += seg[i];
  }
  return coords[coords.length - 1];
}

/** Distância em linha reta (metros) entre dois pontos — fórmula de haversine. */
export function distanceMeters(a: LngLat, b: LngLat) {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Bounding box [oeste, sul, leste, norte] de uma lista de coordenadas. */
export function getBounds(coords: LngLat[]): [number, number, number, number] {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return [west, south, east, north];
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0).replace('.', ',')} km`;
}

export function formatDuration(seconds: number) {
  const totalMin = Math.max(1, Math.round(seconds / 60));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
