import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { AlertIcon } from '@/components/alert-icon';
import { Icon } from '@/components/icon';
import { ALERT_TYPE_BY_ID } from '@/constants/alerts';
import { Brand, BrandShadow } from '@/constants/brand';
import type { Annotation } from '@/store/annotations-store';

/** Sem interação, a pergunta some sozinha depois deste tempo. */
export const HAZARD_CHECK_TIMEOUT_MS = 30_000;

type Props = {
  annotation: Annotation;
  /** "Sim, continua lá" ou tempo esgotado. */
  onStillThere: () => void;
  /** "Não está mais" → remove o incidente. */
  onResolved: () => void;
};

/**
 * Pergunta rápida exibida ao passar por um buraco/acidente (card do protótipo 5):
 * o incidente ainda existe?
 */
export function HazardCheckCard({ annotation, onStillThere, onResolved }: Props) {
  const type = ALERT_TYPE_BY_ID[annotation.type];
  const [progress] = useState(() => new Animated.Value(1));

  // Barra de tempo restante + fechamento automático (o card é remontado por
  // incidente via `key`, então o tempo recomeça a cada pergunta).
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: HAZARD_CHECK_TIMEOUT_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    const timer = setTimeout(onStillThere, HAZARD_CHECK_TIMEOUT_MS);
    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [progress, onStillThere]);

  const created = new Date(annotation.createdAt);
  const date = created.toLocaleDateString('pt-BR');
  const time = created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card} accessibilityRole="alert">
      <Text style={styles.question}>Você passou por aqui. Este problema ainda existe?</Text>

      <View style={styles.row}>
        {annotation.photoUri ? (
          <Image source={{ uri: annotation.photoUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <AlertIcon type={annotation.type} size={34} />
          </View>
        )}

        <View style={styles.info}>
          <View style={styles.badges}>
            <View style={[styles.badge, { borderColor: type.color }]}>
              <AlertIcon type={annotation.type} size={13} />
              <Text style={styles.badgeText}>{type.label}</Text>
            </View>
            <View style={styles.status}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Aberto</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {annotation.title}
          </Text>
          <View style={styles.meta}>
            <Icon name="recent" size={14} color={Brand.textMuted} />
            <Text style={styles.metaText}>
              Registrado em: {date} • {time}
            </Text>
          </View>
          {!!annotation.description && (
            <Text style={styles.body} numberOfLines={2}>
              {annotation.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onResolved}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, styles.resolvedButton, pressed && styles.pressed]}>
          <Text style={styles.resolvedText}>Não existe mais</Text>
        </Pressable>
        <Pressable
          onPress={onStillThere}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, styles.stillButton, pressed && styles.pressed]}>
          <Text style={styles.stillText}>Sim, continua</Text>
        </Pressable>
      </View>

      <View style={styles.timerTrack}>
        <Animated.View
          style={[
            styles.timerBar,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: 12,
    padding: 14,
    paddingBottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Brand.surface,
    ...BrandShadow,
  },
  question: { fontSize: 15, fontWeight: '700', color: Brand.navy },
  row: { flexDirection: 'row', gap: 12 },
  photo: { width: 96, height: 96, borderRadius: 14, backgroundColor: Brand.inputBackground },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: Brand.text },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DDF7EC',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.green },
  statusText: { fontSize: 12, fontWeight: '600', color: '#137A52' },
  title: { fontSize: 16, fontWeight: '700', color: Brand.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: Brand.textMuted },
  body: { fontSize: 13, lineHeight: 17, color: Brand.text },
  actions: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedButton: { borderWidth: 1.5, borderColor: Brand.border },
  resolvedText: { fontSize: 15, fontWeight: '700', color: Brand.danger },
  stillButton: { backgroundColor: Brand.mint },
  stillText: { fontSize: 15, fontWeight: '700', color: Brand.mintText },
  pressed: { opacity: 0.7 },
  timerTrack: { height: 4, marginHorizontal: -14, backgroundColor: Brand.inputBackground },
  timerBar: { height: 4, backgroundColor: Brand.mint },
});
