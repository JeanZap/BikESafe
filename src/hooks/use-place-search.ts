import { useEffect, useRef, useState } from 'react';

import { GeocodingError, type Place, searchPlaces } from '@/services/geocoding';
import { isAbortError, type LngLat } from '@/services/osrm';
import { t } from '@/i18n';

const DEBOUNCE_MS = 400;
const MIN_CHARS = 3;

export type PlaceSearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; places: Place[] }
  | { status: 'error'; message: string };

/**
 * Busca lugares enquanto o usuário digita (com debounce e cancelamento da
 * requisição anterior). `enabled = false` pausa a busca — usado depois que o
 * usuário escolhe um resultado e o texto do campo é preenchido com ele.
 */
export function usePlaceSearch(query: string, near: LngLat | null, enabled: boolean) {
  const [state, setState] = useState<PlaceSearchState>({ status: 'idle' });
  // A posição muda a cada ~10 m; não queremos refazer a busca por isso.
  const nearRef = useRef(near);
  useEffect(() => {
    nearRef.current = near;
  }, [near]);

  useEffect(() => {
    const text = query.trim();
    if (!enabled || text.length < MIN_CHARS) {
      setState({ status: 'idle' });
      return;
    }

    setState({ status: 'loading' });
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const places = await searchPlaces(text, nearRef.current, controller.signal);
        if (!controller.signal.aborted) setState({ status: 'ready', places });
      } catch (err) {
        if (isAbortError(err)) return;
        setState({
          status: 'error',
          message: err instanceof GeocodingError ? err.message : t.errors.searchFailed,
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);

  return state;
}
