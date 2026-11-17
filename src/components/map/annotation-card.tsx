import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AlertIcon } from '@/components/alert-icon';
import { ALERT_TYPE_BY_ID } from '@/constants/alerts';
import { Brand, BrandShadow } from '@/constants/brand';
import type { Annotation } from '@/store/annotations-store';
import { t } from '@/i18n';

type Props = {
  annotation: Annotation;
  onRoute: () => void;
  onClose: () => void;
};

export function AnnotationCard({ annotation, onRoute, onClose }: Props) {
  const type = ALERT_TYPE_BY_ID[annotation.type];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { borderColor: type.color }]}>
          <AlertIcon type={annotation.type} size={14} />
          <Text style={styles.badgeText}>{type.label}</Text>
        </View>
        <Text style={styles.time}>{timeAgo(annotation.createdAt)}</Text>
      </View>

      {!!annotation.photoUri && (
        <Image source={{ uri: annotation.photoUri }} style={styles.photo} contentFit="cover" />
      )}

      <Text style={styles.title}>{annotation.title}</Text>
      {!!annotation.description && <Text style={styles.body}>{annotation.description}</Text>}

      <View style={styles.actions}>
        <Pressable
          onPress={onRoute}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{t.annotation.routeHere}</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryButtonText}>{t.common.close}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return t.annotation.now;
  if (minutes < 60) return t.annotation.minutesAgo(minutes);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t.annotation.hoursAgo(hours);
  const days = Math.round(hours / 24);
  return t.annotation.daysAgo(days);
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: 8,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Brand.surface,
    ...BrandShadow,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: Brand.text },
  time: { fontSize: 13, color: Brand.textMuted },
  photo: { height: 140, borderRadius: 12, backgroundColor: Brand.inputBackground },
  title: { fontSize: 18, fontWeight: '700', color: Brand.text },
  body: { fontSize: 15, lineHeight: 20, color: Brand.text },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pressed: { opacity: 0.7 },
  primaryButton: {
    backgroundColor: Brand.mint,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: Brand.mintText, fontWeight: '700', fontSize: 15 },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  secondaryButtonText: { fontWeight: '600', fontSize: 15, color: Brand.text },
});
