import { useMemo } from 'react';
import { create } from 'zustand';

import type { AlertType } from '@/constants/alerts';
import { VITORIA_ANNOTATIONS } from '@/data/vitoria-annotations';
import type { LngLat } from '@/services/osrm';

export type Annotation = {
  id: string;
  type: AlertType;
  coordinates: LngLat;
  title: string;
  description?: string;
  /** Foto anexada pelo usuário (URI local do dispositivo). */
  photoUri?: string;
  /** ISO 8601 */
  createdAt: string;
};

export type NewAnnotation = Omit<Annotation, 'id' | 'createdAt'>;

type AnnotationsState = {
  annotations: Annotation[];
  /** Filtros da legenda. Vazio = mostra todos os tipos. */
  activeFilters: AlertType[];
  selectedId: string | null;
  /** Mapa de calor das ruas (chip "Calor" da legenda). */
  streetHeat: boolean;

  toggleStreetHeat: () => void;
  toggleFilter: (type: AlertType) => void;
  clearFilters: () => void;
  select: (id: string | null) => void;
  addAnnotation: (input: NewAnnotation) => Annotation;
  removeAnnotation: (id: string) => void;
};

export const useAnnotationsStore = create<AnnotationsState>()((set) => ({
  annotations: VITORIA_ANNOTATIONS,
  activeFilters: [],
  selectedId: null,
  streetHeat: true,

  toggleStreetHeat: () => set((s) => ({ streetHeat: !s.streetHeat })),

  toggleFilter: (type) =>
    set((s) => {
      const activeFilters = s.activeFilters.includes(type)
        ? s.activeFilters.filter((f) => f !== type)
        : [...s.activeFilters, type];
      // Se a anotação selecionada sumiu com o filtro, desseleciona.
      const selected = s.annotations.find((a) => a.id === s.selectedId);
      const stillVisible =
        !selected || activeFilters.length === 0 || activeFilters.includes(selected.type);
      return { activeFilters, selectedId: stillVisible ? s.selectedId : null };
    }),

  clearFilters: () => set({ activeFilters: [] }),

  select: (id) => set({ selectedId: id }),

  addAnnotation: (input) => {
    const annotation: Annotation = {
      ...input,
      id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ annotations: [annotation, ...s.annotations] }));
    return annotation;
  },

  removeAnnotation: (id) =>
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
}));

/** Anotações que passam pelos filtros ativos da legenda. */
export function useVisibleAnnotations() {
  const annotations = useAnnotationsStore((s) => s.annotations);
  const activeFilters = useAnnotationsStore((s) => s.activeFilters);
  return useMemo(
    () =>
      activeFilters.length === 0
        ? annotations
        : annotations.filter((a) => activeFilters.includes(a.type)),
    [annotations, activeFilters]
  );
}

export function useSelectedAnnotation() {
  return useAnnotationsStore((s) => s.annotations.find((a) => a.id === s.selectedId) ?? null);
}
