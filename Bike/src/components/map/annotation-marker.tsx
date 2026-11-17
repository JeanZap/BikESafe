import { StyleSheet, View } from 'react-native';

import { AlertIcon } from '@/components/alert-icon';
import { type AlertType, ALERT_TYPE_BY_ID } from '@/constants/alerts';
import { BrandShadow } from '@/constants/brand';

/** Bolinha branca com o ícone da legenda e borda na cor do tipo. */
export function AnnotationMarker({ type, selected }: { type: AlertType; selected: boolean }) {
  const { color } = ALERT_TYPE_BY_ID[type];
  return (
    <View style={styles.wrap}>
      <View style={[styles.bubble, { borderColor: color }, selected && styles.bubbleSelected]}>
        <AlertIcon type={type} size={selected ? 20 : 16} />
      </View>
      <View style={[styles.tail, { borderTopColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...BrandShadow,
  },
  bubbleSelected: { width: 42, height: 42, borderRadius: 21, borderWidth: 3 },
  tail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
