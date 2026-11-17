import type { LngLat } from '@/services/osrm';

/**
 * Estilo vetorial gratuito e sem chave (OpenFreeMap, dados OpenStreetMap).
 * Outras opções: 'https://tiles.openfreemap.org/styles/bright' ou MapTiler/Stadia (com chave).
 */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Centro usado enquanto a localização ainda não chegou (Vitória - ES). */
export const FALLBACK_CENTER: LngLat = [-40.3010, -20.2960];

export const MapColors = {
  route: '#0A84FF',
  routeCasing: '#FFFFFF',
  destination: '#E5484D',
  accent: '#0A84FF',
} as const;
