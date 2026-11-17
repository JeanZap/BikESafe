import { create } from 'zustand';

import type { Place } from '@/services/geocoding';

export type FavoriteKind = 'home' | 'work';

type PlacesState = {
  home: Place | null;
  work: Place | null;
  /** Destinos escolhidos recentemente (mais recente primeiro). */
  recents: Place[];

  setFavorite: (kind: FavoriteKind, place: Place) => void;
  addRecent: (place: Place) => void;
};

const MAX_RECENTS = 5;

/** Lugares do usuário. Por enquanto só em memória (some ao fechar o app). */
export const usePlacesStore = create<PlacesState>((set) => ({
  home: null,
  work: null,
  recents: [],

  setFavorite: (kind, place) => set({ [kind]: place }),
  addRecent: (place) =>
    set((s) => ({
      recents: [place, ...s.recents.filter((p) => p.id !== place.id)].slice(0, MAX_RECENTS),
    })),
}));
