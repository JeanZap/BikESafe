import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

/**
 * Ícones do app. No iOS usa SF Symbols; no Android/web usa Material Symbols
 * (fonte já embutida no expo-symbols, sem dependência nativa nova).
 */
const ICONS = {
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  filters: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  close: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
  recenter: { ios: 'scope', android: 'my_location', web: 'my_location' },
  megaphone: { ios: 'megaphone.fill', android: 'campaign', web: 'campaign' },
  place: { ios: 'mappin.circle.fill', android: 'location_on', web: 'location_on' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  bike: { ios: 'bicycle', android: 'pedal_bike', web: 'pedal_bike' },
  light: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
  back: { ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' },
  swap: { ios: 'arrow.up.arrow.down', android: 'swap_vert', web: 'swap_vert' },
  shield: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' },
  bolt: { ios: 'bolt', android: 'bolt', web: 'bolt' },
  mountain: { ios: 'mountain.2', android: 'landscape', web: 'landscape' },
  home: { ios: 'house', android: 'home', web: 'home' },
  work: { ios: 'briefcase', android: 'work', web: 'work' },
  pin: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  recent: { ios: 'clock', android: 'schedule', web: 'schedule' },
  person: { ios: 'person', android: 'person', web: 'person' },
  camera: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  stop: { ios: 'xmark', android: 'close', web: 'close' },
  report: { ios: 'exclamationmark.bubble.fill', android: 'report', web: 'report' },
  infraction: { ios: 'exclamationmark.octagon.fill', android: 'block', web: 'block' },
  car: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' },
  parking: { ios: 'parkingsign.circle.fill', android: 'local_parking', web: 'local_parking' },
  anonymous: { ios: 'eye.slash.fill', android: 'visibility_off', web: 'visibility_off' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 24, color, style }: Props) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} style={style} />;
}
