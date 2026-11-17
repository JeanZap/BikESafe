import { useEffect, useMemo, useRef, useState } from 'react';

import { distanceMeters, getBikeRoute, isAbortError, type LngLat } from '@/services/osrm';
import { lineLengthM, projectOnRoute, remainingCoords } from '@/services/route-progress';
import { type ActiveNavigation, useNavigationStore } from '@/store/navigation-store';

/** Fora da rota a partir desta distância → recalcula. */
const OFF_ROUTE_M = 50;
/** Intervalo mínimo entre recálculos (o servidor aceita 1 req/s). */
const REROUTE_COOLDOWN_MS = 20_000;
/** Chegou ao destino quando estiver a menos disso. */
const ARRIVAL_M = 30;
/** Velocidade média só vale depois de um mínimo de tempo e distância. */
const MIN_AVG_ELAPSED_S = 15;
const MIN_AVG_TRAVELED_M = 30;

export type NavigationProgress = {
  nav: ActiveNavigation;
  /** Trecho que falta, começando na posição do usuário. */
  remaining: LngLat[];
  remainingM: number;
  remainingS: number;
  /** km/h, ou null enquanto não há dados suficientes. */
  avgSpeedKmh: number | null;
  arrived: boolean;
  rerouting: boolean;
};

/**
 * Acompanha a navegação ativa: registra o trajeto percorrido, calcula o que
 * falta, detecta chegada e recalcula a rota quando o ciclista sai dela.
 */
export function useNavigation(position: LngLat | null): NavigationProgress | null {
  const nav = useNavigationStore((s) => s.active);
  const recordPosition = useNavigationStore((s) => s.recordPosition);
  const replaceRoute = useNavigationStore((s) => s.replaceRoute);

  const [rerouting, setRerouting] = useState(false);
  const lastRerouteAt = useRef(0);

  useEffect(() => {
    if (nav && position) recordPosition(position);
    // Só reage a novas leituras do GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const geometry = useMemo(() => {
    if (!nav) return null;
    const coords = nav.route.geometry.coordinates;
    if (!position) {
      return { remaining: coords, remainingM: lineLengthM(coords), offsetM: 0 };
    }
    const projection = projectOnRoute(coords, position);
    const remaining = remainingCoords(coords, projection);
    return { remaining, remainingM: lineLengthM(remaining), offsetM: projection.offsetM };
  }, [nav, position]);

  const offRoute = !!geometry && geometry.offsetM > OFF_ROUTE_M;

  // Recalcula a partir da posição atual se o ciclista sair da rota.
  const rerouteAbort = useRef<AbortController | null>(null);
  useEffect(() => () => rerouteAbort.current?.abort(), []);
  useEffect(() => {
    if (!nav) rerouteAbort.current?.abort();
  }, [nav]);

  useEffect(() => {
    if (!nav || !position || !offRoute || rerouting) return;
    if (Date.now() - lastRerouteAt.current < REROUTE_COOLDOWN_MS) return;
    lastRerouteAt.current = Date.now();

    const controller = new AbortController();
    rerouteAbort.current = controller;
    setRerouting(true);
    getBikeRoute(position, nav.destination.coordinates, controller.signal)
      .then((route) => {
        if (!controller.signal.aborted) replaceRoute(route);
      })
      .catch((err) => {
        if (!isAbortError(err)) console.warn('Falha ao recalcular rota', err);
      })
      .finally(() => setRerouting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offRoute, position]);

  if (!nav || !geometry) return null;

  const elapsedS = (Date.now() - nav.startedAt) / 1000;
  const avgSpeedMs =
    elapsedS >= MIN_AVG_ELAPSED_S && nav.traveledM >= MIN_AVG_TRAVELED_M
      ? nav.traveledM / elapsedS
      : null;
  // Sem dados próprios ainda, usa a velocidade prevista pela rota.
  const routeSpeedMs = nav.route.distanceM / Math.max(nav.route.durationS, 1);
  const speedMs = avgSpeedMs && avgSpeedMs > 1 ? avgSpeedMs : routeSpeedMs;

  const arrived =
    !!position &&
    (geometry.remainingM < ARRIVAL_M ||
      distanceMeters(position, nav.destination.coordinates) < ARRIVAL_M);

  return {
    nav,
    remaining: geometry.remaining,
    remainingM: geometry.remainingM,
    remainingS: geometry.remainingM / speedMs,
    avgSpeedKmh: avgSpeedMs !== null ? avgSpeedMs * 3.6 : null,
    arrived,
    rerouting,
  };
}
