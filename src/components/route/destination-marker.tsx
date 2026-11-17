import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Brand } from '@/constants/brand';

/** Destino: selo verde com bicicleta sobre um anel escuro (protótipos 3 e 4). */
export function DestinationMarker() {
  return (
    <View style={styles.marker} pointerEvents="none">
      <View style={styles.badge}>
        <Icon name="bike" size={16} color={Brand.mintText} />
      </View>
      <View style={styles.ring}>
        <View style={styles.ringInner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: { alignItems: 'center', gap: 2 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.navy,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
});
