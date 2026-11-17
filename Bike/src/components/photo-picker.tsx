import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';

import { Icon } from '@/components/icon';
import { Brand } from '@/constants/brand';

type Props = {
  uri: string | null;
  onChange: (uri: string | null) => void;
  style?: StyleProp<ViewStyle>;
};

/** Caixa "FOTO": tira ou escolhe uma foto, mostra a prévia e permite remover. */
export function PhotoPicker({ uri, onChange, style }: Props) {
  const pick = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Câmera bloqueada',
            'Permita o acesso à câmera nas configurações para fotografar o local.'
          );
          return;
        }
      }
      // Sem EXIF: a foto não carrega localização exata nem dados do aparelho.
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.6,
        exif: false,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
    } catch {
      Alert.alert('Foto', 'Não foi possível abrir a câmera ou a galeria.');
    }
  };

  const chooseSource = () => {
    Alert.alert('Adicionar foto', undefined, [
      { text: 'Câmera', onPress: () => pick('camera') },
      { text: 'Galeria', onPress: () => pick('library') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      onPress={chooseSource}
      accessibilityRole="button"
      accessibilityLabel={uri ? 'Trocar foto' : 'Adicionar foto'}
      style={({ pressed }) => [
        styles.photo,
        uri && styles.photoFilled,
        pressed && styles.pressed,
        style,
      ]}>
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remover foto"
            style={styles.photoRemove}>
            <Icon name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </>
      ) : (
        <>
          <Icon name="camera" size={28} color={Brand.text} />
          <Text style={styles.photoText}>FOTO</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  photo: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A9B4C2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoText: { fontSize: 17, fontWeight: '600', color: Brand.text, letterSpacing: 0.5 },
  photoFilled: { borderStyle: 'solid', borderColor: Brand.border, overflow: 'hidden' },
  photoImage: { ...StyleSheet.absoluteFill },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 42, 58, 0.55)',
  },
});
