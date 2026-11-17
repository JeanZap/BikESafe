import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AlertIcon } from '@/components/alert-icon';
import { Icon } from '@/components/icon';
import { PhotoPicker } from '@/components/photo-picker';
import { type AlertType, ALERT_TYPE_BY_ID, ALERT_TYPES } from '@/constants/alerts';
import { Brand } from '@/constants/brand';
import type { NewAnnotation } from '@/store/annotations-store';
import type { LngLat } from '@/services/osrm';
import { t } from '@/i18n';

type Props = {
  /** Local escolhido no mapa; `null` mantém o painel fechado. */
  point: LngLat | null;
  bottomInset: number;
  onClose: () => void;
  onSubmit: (input: NewAnnotation) => void;
};

/** Texto sugerido pelo botão "Assistente" (simulado, sem IA por enquanto). */
const ASSISTANT_SUGGESTIONS: Record<AlertType, string> = t.reportAlert.suggestions;

/** Painel de registro de alerta (protótipo 6). */
export function ReportAlertSheet({ point, bottomInset, onClose, onSubmit }: Props) {
  const [type, setType] = useState<AlertType | null>(null);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Cada novo local começa um registro limpo.
  useEffect(() => {
    if (point) {
      setType(null);
      setDescription('');
      setPhotoUri(null);
    }
  }, [point]);

  const fillWithAssistant = () => {
    if (!type) {
      Alert.alert(t.reportAlert.assistant, t.reportAlert.assistantPickType);
      return;
    }
    setDescription(ASSISTANT_SUGGESTIONS[type]);
  };

  const submit = () => {
    if (!point || !type) return;
    const text = description.trim();
    onSubmit({
      type,
      coordinates: point,
      title: text ? titleFrom(text) : `${ALERT_TYPE_BY_ID[type].label} relatado`,
      description: text || undefined,
      photoUri: photoUri ?? undefined,
    });
  };

  return (
    <Modal
      visible={!!point}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel={t.common.close} />

        <View style={[styles.sheet, { paddingBottom: bottomInset + 20 }]}>
          <View style={styles.handle} />

          <View style={styles.row}>
            <PhotoPicker uri={photoUri} onChange={setPhotoUri} />

            <View style={styles.descriptionBox}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t.reportAlert.description}
                placeholderTextColor={Brand.textMuted}
                multiline
                maxLength={280}
                style={styles.descriptionInput}
              />
              <Pressable
                onPress={fillWithAssistant}
                accessibilityRole="button"
                style={({ pressed }) => [styles.assistant, pressed && styles.pressed]}>
                <Text style={styles.assistantText}>{t.reportAlert.assistant}</Text>
                <Icon name="sparkles" size={16} color={Brand.teal} />
              </Pressable>
            </View>
          </View>

          <View style={styles.types}>
            {ALERT_TYPES.map((t) => {
              const active = t.id === type;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setType(t.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.typeButton,
                    active && { borderColor: t.color, backgroundColor: `${t.color}1A` },
                    pressed && styles.pressed,
                  ]}>
                  <AlertIcon type={t.id} size={20} />
                  <Text style={styles.typeText}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={submit}
            disabled={!type}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.submit,
              !type && styles.submitDisabled,
              pressed && { backgroundColor: Brand.mintPressed },
            ]}>
            <Icon name="megaphone" size={24} color={Brand.mintText} />
            <Text style={styles.submitText}>{t.reportAlert.submit}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Usa a primeira frase da descrição como título do alerta. */
function titleFrom(text: string) {
  const first = text.split(/[.!?\n]/)[0].trim() || text;
  return first.length > 60 ? `${first.slice(0, 57).trimEnd()}…` : first;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },

  sheet: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Brand.surface,
    shadowColor: '#1C2A3A',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.border,
    marginBottom: 4,
  },

  row: { flexDirection: 'row', gap: 12, height: 150 },
  descriptionBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.inputBackground,
    padding: 12,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 16,
    color: Brand.text,
    textAlignVertical: 'top',
    padding: 0,
  },
  assistant: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7EBDD',
    backgroundColor: '#E8FAF5',
  },
  assistantText: { fontSize: 15, fontWeight: '600', color: Brand.mintText },

  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeButton: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Brand.border,
    backgroundColor: Brand.canvas,
  },
  typeText: { fontSize: 16, fontWeight: '600', color: Brand.text },

  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 60,
    borderRadius: 30,
    backgroundColor: Brand.mint,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 20, fontWeight: '700', color: Brand.mintText },
});
