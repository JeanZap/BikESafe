import { create } from 'zustand';

import { type BikeRoute, distanceMeters, type LngLat } from '@/services/osrm';

export type NavigationTarget = { title: string; coordinates: LngLat };

export type ActiveNavigation = {
  destination: NavigationTarget;
  route: BikeRoute;
  /** "Mais segura", "Mais rápida"… */
  routeLabel: string;
  startedAt: number;
  /** Distância percorrida de fato (soma das posições do GPS). */
  traveledM: number;
  lastPosition: LngLat | null;
};

type NavigationState = {
  active: ActiveNavigation | null;
  start: (input: { destination: NavigationTarget; route: BikeRoute; routeLabel: string }) => void;
  stop: () => void;
  /** Troca a rota (recálculo ao sair do trajeto) mantendo as estatísticas. */
  replaceRoute: (route: BikeRoute) => void;
  recordPosition: (position: LngLat) => void;
};

/** Saltos maiores que isso entre duas leituras são ruído do GPS. */
const MAX_GPS_JUMP_M = 200;

export const useNavigationStore = create<NavigationState>((set) => ({
  active: null,

  start: ({ destination, route, routeLabel }) =>
    set({
      active: {
        destination,
        route,
        routeLabel,
        startedAt: Date.now(),
        traveledM: 0,
        lastPosition: null,
      },
    }),

  stop: () => set({ active: null }),

  replaceRoute: (route) => set((s) => (s.active ? { active: { ...s.active, route } } : s)),

  recordPosition: (position) =>
    set((s) => {
      if (!s.active) return s;
      const { lastPosition, traveledM } = s.active;
      const step = lastPosition ? distanceMeters(lastPosition, position) : 0;
      return {
        active: {
          ...s.active,
          lastPosition: position,
          traveledM: step < MAX_GPS_JUMP_M ? traveledM + step : traveledM,
        },
      };
    }),
}));
