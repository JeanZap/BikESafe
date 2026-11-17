import type { IconName } from '@/components/icon';
import { Brand } from '@/constants/brand';

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
  keywords: string[];
  icon: IconName;
  color: string;
}[] = [
  {
    id: 'infraction',
    label: 'Infração',
    hint: 'Avanço de sinal, contramão, veículo na ciclovia…',
    keywords: [
      'avanço de sinal',
      'sinal vermelho',
      'semáforo',
      'contramão',
      'carro na ciclovia',
      'moto na ciclovia',
      'estacionado na ciclovia',
      'faixa de pedestre',
      'multa',
    ],
    icon: 'infraction',
    color: Brand.danger,
  },
  {
    id: 'dangerousDriving',
    label: 'Condução perigosa',
    hint: 'Fechada, ultrapassagem sem distância, excesso de velocidade…',
    keywords: [
      'fechada',
      'ultrapassagem',
      'distância',
      'excesso de velocidade',
      'racha',
      'buzina',
      'celular ao volante',
      'quase atropelamento',
      'direção perigosa',
    ],
    icon: 'car',
    color: Brand.amber,
  },
  {
    id: 'badParking',
    label: 'Bicicleta estacionada em local inapropriado',
    hint: 'Bicicleta bloqueando calçada, rampa, faixa ou entrada.',
    keywords: [
      'bike',
      'estacionada',
      'calçada',
      'rampa',
      'acessibilidade',
      'garagem',
      'entrada',
      'patinete',
      'bloqueando',
    ],
    icon: 'parking',
    color: Brand.blue,
  },
];

export const OCCURRENCE_TYPE_BY_ID = Object.fromEntries(
  OCCURRENCE_TYPES.map((t) => [t.id, t])
) as Record<OccurrenceType, (typeof OCCURRENCE_TYPES)[number]>;
