import { Brand } from '@/constants/brand';
import { t } from '@/i18n';

/**
 * Legenda de alertas do app (chips do cabeçalho e marcadores do mapa).
 */
export type AlertType = 'pothole' | 'accident' | 'bikeLane' | 'noLight';

export const ALERT_TYPES: { id: AlertType; label: string; color: string }[] = [
  { id: 'pothole', label: t.alertTypes.pothole, color: Brand.pothole },
  { id: 'accident', label: t.alertTypes.accident, color: Brand.amber },
  { id: 'bikeLane', label: t.alertTypes.bikeLane, color: Brand.green },
  { id: 'noLight', label: t.alertTypes.noLight, color: Brand.amber },
];

export const ALERT_TYPE_BY_ID = Object.fromEntries(ALERT_TYPES.map((t) => [t.id, t])) as Record<
  AlertType,
  (typeof ALERT_TYPES)[number]
>;
