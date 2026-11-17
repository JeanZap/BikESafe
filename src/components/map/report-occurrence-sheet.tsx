import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Icon } from '@/components/icon';
import { OccurrenceTypeAutocomplete } from '@/components/map/occurrence-type-autocomplete';
import { PhotoPicker } from '@/components/photo-picker';
import { Brand } from '@/constants/brand';
import type { OccurrenceType } from '@/constants/occurrences';
import type { LngLat } from '@/services/osrm';
import { approximate, type NewOccurrence } from '@/store/occurrences-store';
import { t } from '@/i18n';

type Props = {
  visible: boolean;
  /** Posição atual do usuário; se existir, pode ser anexada (aproximada). */
  position: LngLat | null;
  bottomInset: number;
  onClose: () => void;
  onSubmit: (input: NewOccurrence) => void;
};

/** Painel de registro anônimo de ocorrência (infração, condução perigosa, bicicleta mal estacionada). */
export function ReportOccurrenceSheet({ visible, position, bottomInset, onClose, onSubmit }: Props) {
  const [type, setType] = useState<OccurrenceType | null>(null);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [attachLocation, setAttachLocation] = useState(true);
  /** Trocar a chave recria o autocomplete, limpando o texto digitado. */
  const [formKey, setFormKey] = useState(0);

  // Ao fechar ou enviar, limpa o formulário para a próxima abertura.
  const reset = () => {
    setType(null);
    setDescription('');
    setPhotoUri(null);
    setAttachLocation(true);
    setFormKey((k) => k + 1);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!type) return;
    const text = description.trim();
    onSubmit({
      type,
      description: text || undefined,
      photoUri: photoUri ?? undefined,
      coordinates: attachLocation && position ? approximate(position) : undefined,
    });
    reset();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t.common.close} />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 20 }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{t.reportOccurrence.title}</Text>
              <View style={styles.anonymousBadge}>
                <Icon name="anonymous" size={16} color={Brand.mintText} />
                <Text style={styles.anonymousText}>{t.reportOccurrence.anonymous}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Seu nome e seus dados não são enviados. Informe só o que você viu.
            </Text>

            <OccurrenceTypeAutocomplete key={formKey} value={type} onChange={setType} />

            <View style={styles.row}>
              <PhotoPicker uri={photoUri} onChange={setPhotoUri} style={styles.photo} />
              <View style={styles.descriptionBox}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t.reportOccurrence.descriptionPlaceholder}
                  placeholderTextColor={Brand.textMuted}
                  multiline
                  maxLength={400}
                  style={styles.descriptionInput}
                />
              </View>
            </View>

            {position && (
              <View style={styles.locationRow}>
                <Icon name="pin" size={20} color={Brand.textMuted} />
                <Text style={styles.locationText}>{t.reportOccurrence.attachLocation}</Text>
                <Switch
                  value={attachLocation}
                  onValueChange={setAttachLocation}
                  trackColor={{ true: Brand.mint, false: Brand.border }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={t.reportOccurrence.attachLocationA11y}
                />
              </View>
            )}

            <Pressable
              onPress={submit}
              disabled={!type}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.submit,
                !type && styles.submitDisabled,
                pressed && styles.submitPressed,
              ]}>
              <Icon name="anonymous" size={22} color="#FFFFFF" />
              <Text style={styles.submitText}>{t.reportOccurrence.submit}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, minHeight: 60 },

  sheet: {
    maxHeight: '90%',
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
    marginBottom: 10,
  },
  content: { gap: 14, paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: Brand.text, flexShrink: 1 },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8FAF5',
  },
  anonymousText: { fontSize: 13, fontWeight: '700', color: Brand.mintText },
  subtitle: { fontSize: 14, color: Brand.textMuted, marginTop: -6 },

  row: { flexDirection: 'row', gap: 12, height: 120 },
  photo: { width: 120 },
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
    fontSize: 15,
    color: Brand.text,
    textAlignVertical: 'top',
    padding: 0,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { flex: 1, fontSize: 14, color: Brand.text },

  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 58,
    borderRadius: 29,
    backgroundColor: Brand.navy,
  },
  submitPressed: { backgroundColor: Brand.text },
  submitDisabled: { opacity: 0.45 },
  submitText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});
