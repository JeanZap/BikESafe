import { getLocales } from 'expo-localization';

import { en } from '@/i18n/en';
import { pt, type Strings } from '@/i18n/pt';

export type Language = 'en' | 'pt';

/**
 * Idioma do app, lido do aparelho na inicialização: português para qualquer
 * variante `pt`, inglês para todo o resto. Mudar o idioma do sistema exige
 * reabrir o app.
 */
export const language: Language = getLocales()[0]?.languageCode === 'pt' ? 'pt' : 'en';

/** Textos do idioma atual, ex.: `t.profile.title`, `t.annotation.minutesAgo(5)`. */
export const t: Strings = language === 'pt' ? pt : en;

/** Formata um número com o separador decimal do idioma (ex.: 1,6 / 1.6). */
export function formatDecimal(value: number, digits: number) {
  return value.toFixed(digits).replace('.', t.decimalSeparator);
}
