import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LngLat } from '@/services/osrm';

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'error';

/**
 * Pede permissão de localização (em primeiro plano) e acompanha a posição atual.
 * Retorna a posição como [longitude, latitude].
 */
export function useCurrentLocation() {
  const [position, setPosition] = useState<LngLat | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');
  const subscription = useRef<Location.LocationSubscription | null>(null);

  const start = useCallback(async () => {
    setStatus('loading');
    subscription.current?.remove();
    subscription.current = null;

    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }
      setStatus('granted');

      // Posição rápida (cache) para centralizar o mapa sem esperar o GPS.
      const last = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
      if (last) setPosition([last.coords.longitude, last.coords.latitude]);

      subscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setPosition([loc.coords.longitude, loc.coords.latitude]),
        () => setStatus('error')
      );
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    start();
    return () => subscription.current?.remove();
  }, [start]);

  return { position, status, retry: start };
}
