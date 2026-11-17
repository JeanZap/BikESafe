import { Brand } from '@/constants/brand';

/**
 * Legenda de alertas do app (chips do cabeçalho e marcadores do mapa).
 */
export type AlertType = 'pothole' | 'accident' | 'bikeLane' | 'noLight';

export const ALERT_TYPES: { id: AlertType; label: string; color: string }[] = [
  { id: 'pothole', label: 'Buraco', color: Brand.pothole },
  { id: 'accident', label: 'Acidente', color: Brand.amber },
  { id: 'bikeLane', label: 'Ciclovia', color: Brand.green },
  { id: 'noLight', label: 'Falta de luz', color: Brand.amber },
];

export const ALERT_TYPE_BY_ID = Object.fromEntries(ALERT_TYPES.map((t) => [t.id, t])) as Record<
  AlertType,
  (typeof ALERT_TYPES)[number]
>;
