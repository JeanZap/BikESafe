/**
 * Busca de endereços/lugares por texto (geocodificação) via Photon.
 *
 * Photon (photon.komoot.io) é um geocoder gratuito e sem chave baseado no
 * OpenStreetMap, feito para busca enquanto o usuário digita (autocomplete).
 * O Nominatim, por política de uso, NÃO permite autocomplete.
 * Atribuição: "© colaboradores do OpenStreetMap".
 */
import { isAbortError, type LngLat } from '@/services/osrm';

export type Place = {
  id: string;
  /** Linha principal: nome do lugar ou rua + número. */
  title: string;
  /** Linha secundária: bairro, cidade, estado. */
  subtitle: string;
  coordinates: LngLat;
};

const PHOTON_URL = 'https://photon.komoot.io/api/';
const USER_AGENT = 'BikESafe/1.0 (hackathon)';

type PhotonFeature = {
  geometry: { type: 'Point'; coordinates: LngLat };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

export class GeocodingError extends Error {}

export async function searchPlaces(
  query: string,
  near?: LngLat | null,
  signal?: AbortSignal
): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, limit: '8', lang: 'default' });
  if (near) {
    // Prioriza resultados próximos ao usuário.
    params.set('lon', String(near[0]));
    params.set('lat', String(near[1]));
    params.set('zoom', '12');
    params.set('location_bias_scale', '0.3');
  }

  let res: Response;
  try {
    res = await fetch(`${PHOTON_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal,
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new GeocodingError('Sem conexão para buscar endereços.');
  }

  if (!res.ok) throw new GeocodingError('Não foi possível buscar endereços agora.');

  const json = (await res.json().catch(() => null)) as { features?: PhotonFeature[] } | null;
  const features = json?.features ?? [];

  // Prefere resultados do Brasil quando houver; remove duplicados.
  const sorted = [...features].sort(
    (a, b) => Number(b.properties.countrycode === 'BR') - Number(a.properties.countrycode === 'BR')
  );
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const f of sorted) {
    const place = toPlace(f);
    const key = `${place.title}|${place.subtitle}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(place);
  }
  return places.slice(0, 6);
}

function toPlace(feature: PhotonFeature): Place {
  const p = feature.properties;
  const streetLine = [p.street, p.housenumber].filter(Boolean).join(', ');
  const title = p.name ?? (streetLine || p.city || p.state || 'Local sem nome');

  const parts = [
    p.name && streetLine ? streetLine : null,
    p.district ?? p.locality,
    p.city ?? p.county,
    p.state,
  ].filter((part): part is string => !!part && part !== title);

  return {
    id: `${p.osm_type ?? ''}${p.osm_id ?? `${feature.geometry.coordinates.join(',')}`}`,
    title,
    subtitle: [...new Set(parts)].join(' · '),
    coordinates: feature.geometry.coordinates,
  };
}
