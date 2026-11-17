import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';

const HALO = 64;
const LABEL_HEIGHT = 34;
const GAP = 6;

/**
 * Ponto azul com halo e a pílula "Sua Localização" acima, como no protótipo.
 * Um espaçador invisível embaixo deixa o ponto exatamente no centro da view,
 * para usar com anchor="center" no <Marker>.
 */
export function UserLocationMarker() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.label}>
        <Text style={styles.labelText}>Sua Localização</Text>
      </View>
      <View style={styles.halo}>
        <View style={styles.dot} />
      </View>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: GAP },
  label: {
    height: LABEL_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: LABEL_HEIGHT / 2,
    backgroundColor: Brand.navy,
  },
  labelText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  halo: {
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: Brand.blueHalo,
    borderWidth: 1,
    borderColor: Brand.blueHaloBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Brand.blue,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  spacer: { height: LABEL_HEIGHT },
});
