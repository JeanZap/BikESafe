import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, BrandShadow } from '@/constants/brand';
import type { NavigationProgress } from '@/hooks/use-navigation';

type Props = {
  progress: NavigationProgress;
  bottomInset: number;
  onStop: () => void;
  onLayout?: (height: number) => void;
};

function timeParts(seconds: number): [string, string] {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return [String(min), 'min'];
  const h = Math.floor(min / 60);
  return [`${h}:${String(min % 60).padStart(2, '0')}`, 'h'];
}

function distanceParts(meters: number): [string, string] {
  if (meters < 1000) return [String(Math.max(0, Math.round(meters / 10) * 10)), 'm'];
  return [(meters / 1000).toFixed(meters < 10_000 ? 1 : 0).replace('.', ','), 'km'];
}

/** Painel inferior da navegação (protótipo 4). Toque para ver destino e encerrar. */
export function NavigationPanel({ progress, bottomInset, onStop, onLayout }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [time, timeUnit] = timeParts(progress.remainingS);
  const [dist, distUnit] = distanceParts(progress.remainingM);
  const speed = progress.avgSpeedKmh !== null ? String(Math.round(progress.avgSpeedKmh)) : '–';

  return (
    <View
      style={[styles.panel, { paddingBottom: bottomInset + 14 }]}
      onLayout={(e) => onLayout?.(e.nativeEvent.layout.height)}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Recolher painel da rota' : 'Expandir painel da rota'}
        hitSlop={8}
        style={styles.handleArea}>
        <View style={styles.handle} />
      </Pressable>

      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.stats}>
        <Stat label="Temp. faltante" value={time} unit={timeUnit} />
        <View style={styles.divider} />
        <Stat label="Distância" value={dist} unit={distUnit} />
        <View style={styles.divider} />
        <Stat label="Vel. Méd." value={speed} unit="km/h" />
      </Pressable>

      {progress.rerouting && (
        <View style={styles.rerouting}>
          <ActivityIndicator size="small" color={Brand.teal} />
          <Text style={styles.reroutingText}>Recalculando rota…</Text>
        </View>
      )}

      {expanded && (
        <View style={styles.details}>
          <View style={styles.detailsText}>
            <Text style={styles.detailsLabel}>{progress.nav.routeLabel.toUpperCase()}</Text>
            <Text style={styles.detailsTitle} numberOfLines={1}>
              {progress.nav.destination.title}
            </Text>
          </View>
          <Pressable
            onPress={onStop}
            accessibilityRole="button"
            style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}>
            <Text style={styles.stopButtonText}>Encerrar rota</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Brand.surface,
    ...BrandShadow,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },
  pressed: { opacity: 0.7 },
  handleArea: { alignSelf: 'center', paddingVertical: 8 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Brand.border },
  stats: { flexDirection: 'row', alignItems: 'stretch', paddingVertical: 6 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  statLabel: { fontSize: 14, color: Brand.textMuted, fontWeight: '500' },
  statValue: { fontSize: 30, fontWeight: '700', color: Brand.text },
  statUnit: { fontSize: 15, fontWeight: '500', color: Brand.textMuted },

  rerouting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  reroutingText: { fontSize: 13, fontWeight: '600', color: Brand.teal },

  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  detailsText: { flex: 1 },
  detailsLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: Brand.teal },
  detailsTitle: { fontSize: 16, fontWeight: '600', color: Brand.text, marginTop: 2 },
  stopButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
  },
  stopButtonText: { fontSize: 15, fontWeight: '700', color: Brand.danger },
});
