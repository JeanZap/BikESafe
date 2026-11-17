/**
 * Paleta da tela principal, baseada no protótipo (prototipo/1.jpeg).
 */
export const Brand = {
  /** Fundo do cabeçalho / áreas neutras. */
  canvas: '#F5F7FB',
  surface: '#FFFFFF',
  /** Campo de busca. */
  inputBackground: '#F2F5F9',
  border: '#E1E7EF',

  text: '#1C2A3A',
  textMuted: '#6B7785',
  /** Pílula escura "Sua Localização". */
  navy: '#26364A',

  /** Verde-menta do botão "Registrar Alerta". */
  mint: '#3EE0BF',
  mintPressed: '#2CCDAC',
  mintText: '#0F2A33',

  /** Azul da localização do usuário. */
  blue: '#2F6BFF',
  blueHalo: 'rgba(47, 107, 255, 0.18)',
  blueHaloBorder: 'rgba(47, 107, 255, 0.28)',

  /** Botão "Registrar ocorrência" (borda e texto). */
  orange: '#F26B1D',
  orangeSoft: '#FFF1E8',

  danger: '#E5484D',
  amber: '#F2B705',
  green: '#1FB57A',
  /** Rota selecionada e ícones das opções de rota (protótipo 3). */
  teal: '#14B8A6',
  pothole: '#7A828C',
} as const;

export const BrandShadow = {
  shadowColor: '#1C2A3A',
  shadowOpacity: 0.1,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
} as const;
