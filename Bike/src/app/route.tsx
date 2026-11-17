import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { RoutePlanner } from '@/components/route/route-planner';
import type { LngLat } from '@/services/osrm';

export type RouteScreenParams = {
  title: string;
  lng: string;
  lat: string;
  originLng?: string;
  originLat?: string;
};

/** Tela 3 do protótipo: escolha entre as rotas até o destino. */
export default function RouteScreen() {
  const params = useLocalSearchParams<RouteScreenParams>();

  const destination = useMemo(
    () => ({
      title: params.title || 'Destino',
      coordinates: [Number(params.lng), Number(params.lat)] as LngLat,
    }),
    [params.title, params.lng, params.lat]
  );

  const initialOrigin = useMemo<LngLat | null>(() => {
    const lng = Number(params.originLng);
    const lat = Number(params.originLat);
    return params.originLng && params.originLat && Number.isFinite(lng) && Number.isFinite(lat)
      ? [lng, lat]
      : null;
  }, [params.originLng, params.originLat]);

  return <RoutePlanner destination={destination} initialOrigin={initialOrigin} />;
}
