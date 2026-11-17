import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AlertIcon } from '@/components/alert-icon';
import { Icon, type IconName } from '@/components/icon';
import { ALERT_TYPES } from '@/constants/alerts';
import { Brand, BrandShadow } from '@/constants/brand';
import { VITORIA_SUGGESTIONS } from '@/data/vitoria-suggestions';
import type { PlaceSearchState } from '@/hooks/use-place-search';
import type { Place } from '@/services/geocoding';
import { COLOR_HIGH, COLOR_MID } from '@/services/route-heat';
import { distanceMeters, formatDistance, type LngLat } from '@/services/osrm';
import { useAnnotationsStore } from '@/store/annotations-store';
import { type FavoriteKind, usePlacesStore } from '@/store/places-store';
import { t } from '@/i18n';

type Props = {
  topInset: number;
  query: string;
  onChangeQuery: (text: string) => void;
  onClearQuery: () => void;
  search: PlaceSearchState;
  /** Painel de busca aberto (campo focado ou digitando). */
  showResults: boolean;
  onFocusSearch: () => void;
  onCloseSearch: () => void;
  onSelectPlace: (place: Place) => void;
  /** Posição do usuário, para ordenar sugestões e mostrar distâncias. */
  position: LngLat | null;
};

const MIN_CHARS = 3;
/** Só sugere lugares de Vitória se o usuário estiver na região. */
const SUGGESTION_RADIUS_M = 40_000;
const MAX_SUGGESTIONS = 4;

const FAVORITES: { kind: FavoriteKind; label: string; icon: IconName }[] = [
  { kind: 'home', label: t.search.home, icon: 'home' },
  { kind: 'work', label: t.search.work, icon: 'work' },
];

type Row = { place: Place; icon: IconName };

export function SearchHeader({
  topInset,
  query,
  onChangeQuery,
  onClearQuery,
  search,
  showResults,
  onFocusSearch,
  onCloseSearch,
  onSelectPlace,
  position,
}: Props) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const activeFilters = useAnnotationsStore((s) => s.activeFilters);
  const toggleFilter = useAnnotationsStore((s) => s.toggleFilter);
  const streetHeat = useAnnotationsStore((s) => s.streetHeat);
  const toggleStreetHeat = useAnnotationsStore((s) => s.toggleStreetHeat);

  const home = usePlacesStore((s) => s.home);
  const work = usePlacesStore((s) => s.work);
  const recents = usePlacesStore((s) => s.recents);
  const setFavorite = usePlacesStore((s) => s.setFavorite);
  const addRecent = usePlacesStore((s) => s.addRecent);
  const favorites = { home, work };

  /** Quando definido, o próximo lugar escolhido vira Casa/Trabalho. */
  const [picking, setPicking] = useState<FavoriteKind | null>(null);
  // Fechar o painel cancela a escolha de Casa/Trabalho.
  useEffect(() => {
    if (!showResults) setPicking(null);
  }, [showResults]);

  const typing = query.trim().length >= MIN_CHARS;

  const suggestions = useMemo<Row[]>(() => {
    let nearby = VITORIA_SUGGESTIONS;
    if (position) {
      nearby = VITORIA_SUGGESTIONS.filter(
        (p) => distanceMeters(position, p.coordinates) < SUGGESTION_RADIUS_M
      ).sort(
        (a, b) => distanceMeters(position, a.coordinates) - distanceMeters(position, b.coordinates)
      );
    }
    const recentRows = recents.slice(0, 2).map((place) => ({ place, icon: 'recent' as const }));
    const recentIds = new Set(recents.map((p) => p.id));
    const nearbyRows = nearby
      .filter((p) => !recentIds.has(p.id))
      .slice(0, MAX_SUGGESTIONS - recentRows.length)
      .map((place) => ({ place, icon: 'pin' as const }));
    return [...nearbyRows, ...recentRows];
  }, [position, recents]);

  const resultRows: Row[] =
    search.status === 'ready' ? search.places.map((place) => ({ place, icon: 'pin' })) : [];

  const choose = (place: Place) => {
    Keyboard.dismiss();
    if (picking) {
      setFavorite(picking, place);
      setPicking(null);
      onClearQuery();
      onCloseSearch();
      return;
    }
    addRecent(place);
    onSelectPlace(place);
  };

  const pressFavorite = (kind: FavoriteKind) => {
    const saved = favorites[kind];
    if (saved && !picking) {
      choose(saved);
      return;
    }
    setPicking(kind);
    onClearQuery();
    inputRef.current?.focus();
  };

  const subtitleFor = (place: Place) => {
    const parts = place.subtitle ? [place.subtitle] : [];
    if (position) parts.push(formatDistance(distanceMeters(position, place.coordinates)));
    return parts.join(' · ');
  };

  const pickingLabel = picking === 'home' ? t.search.home : t.search.work;

  return (
    <View style={[styles.header, { paddingTop: topInset + 12 }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.search.profileA11y}
          onPress={() => router.push('/profile')}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Icon name="profile" size={34} color={Brand.text} />
        </Pressable>

        {/* O campo e o painel formam um único cartão que se abre sobre o mapa. */}
        <View style={styles.searchSlot}>
          {/* collapsable={false}: evita que o Android recrie a view nativa (e tire o
              foco do campo) quando o estilo do cartão muda ao abrir a busca. */}
          <View collapsable={false} style={[styles.card, showResults && styles.cardOpen]}>
            <View
              collapsable={false}
              style={[styles.searchBox, showResults && styles.searchBoxOpen]}>
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={onChangeQuery}
                placeholder={picking ? t.search.pickingPlaceholder(pickingLabel) : t.search.placeholder}
                placeholderTextColor={Brand.textMuted}
                style={styles.input}
                returnKeyType="search"
                autoCorrect={false}
                onFocus={() => {
                  if (showResults) return;
                  onFocusSearch();
                  // Abrir o painel re-renderiza o cartão; se o Android tirar o foco
                  // nesse meio-tempo, devolve-o para o teclado abrir no 1º toque.
                  requestAnimationFrame(() => {
                    if (!inputRef.current?.isFocused()) inputRef.current?.focus();
                  });
                }}
                onSubmitEditing={() => {
                  if (search.status === 'ready' && search.places[0]) choose(search.places[0]);
                }}
                accessibilityLabel={t.search.searchA11y}
              />
              {search.status === 'loading' ? (
                <ActivityIndicator size="small" color={Brand.textMuted} />
              ) : query.length > 0 ? (
                <Pressable onPress={onClearQuery} hitSlop={10} accessibilityLabel={t.search.clearA11y}>
                  <Icon name="close" size={20} color={Brand.textMuted} />
                </Pressable>
              ) : (
                <Icon name="search" size={24} color={Brand.text} />
              )}
            </View>

            {showResults && (
              <ScrollView
                style={styles.panel}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                {picking && (
                  <View style={styles.pickingBanner}>
                    <Text style={styles.pickingText}>
                      {t.search.pickingHint(pickingLabel.toLowerCase())}
                    </Text>
                    <Pressable onPress={() => setPicking(null)} hitSlop={8}>
                      <Text style={styles.pickingCancel}>{t.common.cancel}</Text>
                    </Pressable>
                  </View>
                )}

                {!typing && !picking && (
                  <View style={styles.favorites}>
                    {FAVORITES.map((fav) => {
                      const saved = favorites[fav.kind];
                      return (
                        <Pressable
                          key={fav.kind}
                          onPress={() => pressFavorite(fav.kind)}
                          onLongPress={() => {
                            setPicking(fav.kind);
                            inputRef.current?.focus();
                          }}
                          accessibilityRole="button"
                          accessibilityHint={
                            saved ? t.search.changeAddressHint : undefined
                          }
                          style={({ pressed }) => [styles.favorite, pressed && styles.rowPressed]}>
                          <Icon name={fav.icon} size={20} color={Brand.text} />
                          <View style={styles.favoriteText}>
                            <Text style={styles.favoriteTitle}>{fav.label}</Text>
                            <Text style={styles.favoriteSubtitle} numberOfLines={1}>
                              {saved ? saved.title : t.search.setAddress}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {typing ? (
                  <>
                    {search.status === 'loading' && <Text style={styles.message}>{t.search.searching}</Text>}
                    {search.status === 'error' && (
                      <Text style={styles.message}>{search.message}</Text>
                    )}
                    {search.status === 'ready' && resultRows.length === 0 && (
                      <Text style={styles.message}>{t.search.noResults}</Text>
                    )}
                    {resultRows.length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>{t.search.results}</Text>
                        {resultRows.map((row, i) => (
                          <PlaceRow
                            key={row.place.id}
                            row={row}
                            subtitle={subtitleFor(row.place)}
                            divider={i > 0}
                            onPress={() => choose(row.place)}
                          />
                        ))}
                        <Text style={styles.attribution}>
                          Busca: Photon · © colaboradores do OpenStreetMap
                        </Text>
                      </>
                    )}
                  </>
                ) : (
                  suggestions.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>{t.search.nearby}</Text>
                      {suggestions.map((row, i) => (
                        <PlaceRow
                          key={row.place.id}
                          row={row}
                          subtitle={subtitleFor(row.place)}
                          divider={i > 0}
                          onPress={() => choose(row.place)}
                        />
                      ))}
                    </>
                  )
                )}
              </ScrollView>
            )}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.search.filtersA11y}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Icon name="filters" size={30} color={Brand.text} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        style={styles.chipsScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={toggleStreetHeat}
          accessibilityRole="togglebutton"
          accessibilityLabel={t.search.heatA11y}
          accessibilityState={{ checked: streetHeat }}
          style={({ pressed }) => [
            styles.chip,
            streetHeat && styles.chipActive,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.chipLabel}>{t.search.heat}</Text>
          <View style={styles.heatSwatch}>
            <View style={[styles.heatSwatchPart, { backgroundColor: Brand.teal }]} />
            <View style={[styles.heatSwatchPart, { backgroundColor: COLOR_MID }]} />
            <View style={[styles.heatSwatchPart, { backgroundColor: COLOR_HIGH }]} />
          </View>
        </Pressable>
        {ALERT_TYPES.map((filter) => {
          const active = activeFilters.includes(filter.id);
          return (
            <Pressable
              key={filter.id}
              onPress={() => toggleFilter(filter.id)}
              accessibilityRole="togglebutton"
              accessibilityState={{ checked: active }}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.chipLabel}>{filter.label}</Text>
              <AlertIcon type={filter.id} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PlaceRow({
  row,
  subtitle,
  divider,
  onPress,
}: {
  row: Row;
  subtitle: string;
  divider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.rowIcon}>
        <Icon name={row.icon} size={18} color={Brand.teal} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {row.place.title}
        </Text>
        {!!subtitle && (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const SEARCH_HEIGHT = 52;
const CARD_BORDER = '#2FD3B4';

const styles = StyleSheet.create({
  header: {
    backgroundColor: Brand.canvas,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
    zIndex: 10,
    ...BrandShadow,
    shadowOpacity: 0.06,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },

  // Reserva a altura do campo; o cartão aberto transborda para baixo.
  searchSlot: { flex: 1, height: SEARCH_HEIGHT, zIndex: 2 },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.inputBackground,
  },
  cardOpen: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: CARD_BORDER,
    backgroundColor: Brand.surface,
    ...BrandShadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  searchBox: {
    height: SEARCH_HEIGHT - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 13,
    backgroundColor: Brand.inputBackground,
  },
  searchBoxOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: Brand.text,
    paddingVertical: 0,
  },

  panel: {
    maxHeight: 440,
    backgroundColor: Brand.surface,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  favorites: { flexDirection: 'row', gap: 10, padding: 12, paddingBottom: 4 },
  favorite: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
  },
  favoriteText: { flex: 1 },
  favoriteTitle: { fontSize: 15, fontWeight: '600', color: Brand.text },
  favoriteSubtitle: { fontSize: 12, fontWeight: '500', color: Brand.teal, marginTop: 1 },

  pickingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    margin: 12,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#E8FBF6',
  },
  pickingText: { flex: 1, fontSize: 14, fontWeight: '600', color: Brand.mintText },
  pickingCancel: { fontSize: 14, fontWeight: '700', color: Brand.teal },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Brand.textMuted,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  message: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Brand.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  rowPressed: { backgroundColor: Brand.inputBackground },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8FBF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: Brand.text },
  rowSubtitle: { fontSize: 13, color: Brand.textMuted, marginTop: 2 },
  attribution: {
    fontSize: 10,
    color: Brand.textMuted,
    textAlign: 'right',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  chipsScroll: { zIndex: 1 },
  chips: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  chipActive: {
    backgroundColor: '#E6FBF6',
    borderColor: Brand.mint,
  },
  heatSwatch: {
    flexDirection: 'row',
    width: 24,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  heatSwatchPart: { flex: 1 },
  chipLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Brand.text,
  },
});
