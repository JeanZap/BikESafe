import { useCallback, useEffect, useRef, useState } from 'react';

import type { LngLat } from '@/services/osrm';
import { lineLengthM, projectOnRoute } from '@/services/route-progress';

/** Velocidade base da simulação (ciclista urbano). */
const BASE_SPEED_KMH = 18;
/** Multiplicadores disponíveis ao tocar no botão de velocidade. */
export const SIM_SPEEDS = [1, 3, 10] as const;
const TICK_MS = 1000;

export type RouteSimulation = {
  /** Posição simulada, ou null quando a simulação não está ativa. */
  position: LngLat | null;
  /** Direção do deslocamento em graus (0 = norte). */
  bearing: number;
  running: boolean;
  speed: (typeof SIM_SPEEDS)[number];
  toggle: () => void;
  cycleSpeed: () => void;
};

/** Ponto a `distance` metros do início da linha, e o rumo do segmento. */
function pointAlong(coords: LngLat[], distance: number): { point: LngLat; bearing: number } {
  let walked = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1];
    const b = coords[i];
    const seg = lineLengthM([a, b]);
    if (walked + seg >= distance || i === coords.length - 1) {
      const t = seg ? Math.min(1, Math.max(0, (distance - walked) / seg)) : 1;
      return { point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], bearing: bearingOf(a, b) };
    }
    walked += seg;
  }
  return { point: coords[coords.length - 1], bearing: 0 };
}

function bearingOf(a: LngLat, b: LngLat) {
  const dx = (b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180);
  const dy = b[1] - a[1];
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}

/** Distância ao longo da linha até a projeção de `p`. */
function distanceAlong(coords: LngLat[], p: LngLat) {
  const proj = projectOnRoute(coords, p);
  return lineLengthM([...coords.slice(0, proj.segment + 1), proj.point]);
}

/**
 * Apenas para testes: percorre a rota ativa como se o ciclista estivesse
 * pedalando, gerando uma posição por segundo. Se a rota for trocada
 * (recálculo), continua a partir do ponto mais próximo na nova rota.
 */
export function useRouteSimulation(coords: LngLat[] | null): RouteSimulation {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<(typeof SIM_SPEEDS)[number]>(1);
  const [state, setState] = useState<{ position: LngLat; bearing: number } | null>(null);
  const traveled = useRef(0);
  const lastCoords = useRef<LngLat[] | null>(null);

  // Sem rota (navegação encerrada) → desliga.
  const [hadRoute, setHadRoute] = useState(!!coords);
  if (hadRoute !== !!coords) {
    setHadRoute(!!coords);
    if (!coords) {
      setRunning(false);
      setState(null);
    }
  }

  // Rota trocada: reposiciona na nova linha.
  useEffect(() => {
    if (!coords || coords === lastCoords.current) return;
    if (lastCoords.current && state) traveled.current = distanceAlong(coords, state.position);
    lastCoords.current = coords;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  useEffect(() => {
    if (!running || !coords || coords.length < 2) return;
    const step = () => {
      const total = lineLengthM(coords);
      traveled.current = Math.min(total, traveled.current + ((BASE_SPEED_KMH * speed) / 3.6) * (TICK_MS / 1000));
      const { point, bearing } = pointAlong(coords, traveled.current);
      setState({ position: point, bearing });
      if (traveled.current >= total) setRunning(false);
    };
    if (!state) {
      traveled.current = 0;
      step();
    }
    const id = setInterval(step, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, coords, speed]);

  const toggle = useCallback(() => setRunning((r) => !r), []);
  const cycleSpeed = useCallback(
    () => setSpeed((s) => SIM_SPEEDS[(SIM_SPEEDS.indexOf(s) + 1) % SIM_SPEEDS.length]),
    []
  );

  return {
    position: state?.position ?? null,
    bearing: state?.bearing ?? 0,
    running,
    speed,
    toggle,
    cycleSpeed,
  };
}
