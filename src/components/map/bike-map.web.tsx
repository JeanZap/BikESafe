import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * O MapLibre React Native não roda na web. Este arquivo evita que o bundle web
 * quebre; o mapa funciona no Android/iOS (development build).
 */
export function BikeMap() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>
        O mapa está disponível no app Android/iOS.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 16, textAlign: 'center' },
});
