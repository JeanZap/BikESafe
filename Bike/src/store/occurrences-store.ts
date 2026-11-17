import { create } from 'zustand';

import type { OccurrenceType } from '@/constants/occurrences';
import type { LngLat } from '@/services/osrm';

/**
 * Ocorrido registrado de forma anônima: não guarda nenhum dado do usuário,
 * só o que ele escolheu informar.
 */
export type Occurrence = {
  id: string;
  /** Código curto mostrado ao usuário para acompanhar o relato. */
  protocol: string;
  type: OccurrenceType;
  description?: string;
  /** Foto anexada (URI local do dispositivo). */
  photoUri?: string;
  /** Local aproximado, se o usuário optou por anexá-lo. */
  coordinates?: LngLat;
  /** ISO 8601 */
  createdAt: string;
};

export type NewOccurrence = Omit<Occurrence, 'id' | 'protocol' | 'createdAt'>;

type OccurrencesState = {
  occurrences: Occurrence[];
  addOccurrence: (input: NewOccurrence) => Occurrence;
};

export const useOccurrencesStore = create<OccurrencesState>()((set) => ({
  occurrences: [],

  addOccurrence: (input) => {
    const occurrence: Occurrence = {
      ...input,
      id: `occ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      protocol: Math.random().toString(36).slice(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ occurrences: [occurrence, ...s.occurrences] }));
    return occurrence;
  },
}));

/** Arredonda para ~100 m, para o local não identificar o denunciante. */
export function approximate([lng, lat]: LngLat): LngLat {
  return [Math.round(lng * 1000) / 1000, Math.round(lat * 1000) / 1000];
}
