import type { IconName } from '@/components/icon';
import { Brand } from '@/constants/brand';
import { t } from '@/i18n';

/**
 * Tipos de ocorrido que o ciclista pode registrar anonimamente
 * (comportamento de terceiros, não obstáculos da via).
 */
export type OccurrenceType = 'infraction' | 'dangerousDriving' | 'badParking';

export const OCCURRENCE_TYPES: {
  id: OccurrenceType;
  label: string;
  hint: string;
  /** Termos que também levam a este tipo no autocomplete. */
  keywords: readonly string[];
  icon: IconName;
  color: string;
}[] = [
  {
    id: 'infraction',
    ...t.occurrences.infraction,
    icon: 'infraction',
    color: Brand.danger,
  },
  {
    id: 'dangerousDriving',
    ...t.occurrences.dangerousDriving,
    icon: 'car',
    color: Brand.amber,
  },
  {
    id: 'badParking',
    ...t.occurrences.badParking,
    icon: 'parking',
    color: Brand.blue,
  },
];

export const OCCURRENCE_TYPE_BY_ID = Object.fromEntries(
  OCCURRENCE_TYPES.map((t) => [t.id, t])
) as Record<OccurrenceType, (typeof OCCURRENCE_TYPES)[number]>;
