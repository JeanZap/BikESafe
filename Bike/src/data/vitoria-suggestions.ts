import type { Place } from '@/services/geocoding';

/**
 * Lugares populares de Vitória/ES sugeridos antes de o usuário digitar.
 * Coordenadas conferidas no Photon (OpenStreetMap).
 */
export const VITORIA_SUGGESTIONS: Place[] = [
  {
    id: 'sug-faesa',
    title: 'FAESA – Campus II',
    subtitle: 'Santos Reis, Vitória',
    coordinates: [-40.3364, -20.2868],
  },
  {
    id: 'sug-praca-do-papa',
    title: 'Praça do Papa',
    subtitle: 'Enseada do Suá, Vitória',
    coordinates: [-40.2946, -20.3163],
  },
  {
    id: 'sug-parque-moscoso',
    title: 'Parque Moscoso',
    subtitle: 'Centro, Vitória',
    coordinates: [-40.3421, -20.3197],
  },
  {
    id: 'sug-shopping-vitoria',
    title: 'Shopping Vitória',
    subtitle: 'Enseada do Suá, Vitória',
    coordinates: [-40.2879, -20.3128],
  },
  {
    id: 'sug-praca-dos-namorados',
    title: 'Praça dos Namorados',
    subtitle: 'Praia do Canto, Vitória',
    coordinates: [-40.2914, -20.2998],
  },
  {
    id: 'sug-pedra-da-cebola',
    title: 'Parque Pedra da Cebola',
    subtitle: 'Mata da Praia, Vitória',
    coordinates: [-40.2976, -20.2767],
  },
];
