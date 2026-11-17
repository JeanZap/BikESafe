import { StyleSheet, Text, View } from 'react-native';

import type { LngLat } from '@/services/osrm';

type Props = {
  destination: { title: string; coordinates: LngLat };
  initialOrigin: LngLat | null;
};

/** O MapLibre React Native não roda na web; a tela funciona no Android/iOS. */
export function RoutePlanner({ destination }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Rotas até {destination.title} estão disponíveis no app Android/iOS.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 16, textAlign: 'center' },
});
