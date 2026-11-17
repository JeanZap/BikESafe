import { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Brand } from '@/constants/brand';
import {
  OCCURRENCE_TYPE_BY_ID,
  OCCURRENCE_TYPES,
  type OccurrenceType,
} from '@/constants/occurrences';

type Props = {
  value: OccurrenceType | null;
  onChange: (type: OccurrenceType | null) => void;
};

type Suggestion = {
  type: (typeof OCCURRENCE_TYPES)[number];
  /** Palavra-chave que casou com a busca (quando não foi o próprio nome). */
  matchedKeyword?: string;
};

/** Minúsculas e sem acentos, para "contramao" achar "contramão". */
function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function suggest(query: string): Suggestion[] {
  const q = normalize(query);
  if (!q) return OCCURRENCE_TYPES.map((type) => ({ type }));
  const results: Suggestion[] = [];
  for (const type of OCCURRENCE_TYPES) {
    if (normalize(type.label).includes(q)) {
      results.push({ type });
      continue;
    }
    const keyword = type.keywords.find((k) => normalize(k).includes(q));
    if (keyword) results.push({ type, matchedKeyword: keyword });
  }
  return results;
}

/** Campo com autocomplete para escolher o tipo de ocorrência. */
export function OccurrenceTypeAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(() => suggest(query), [query]);

  const selected = value ? OCCURRENCE_TYPE_BY_ID[value] : null;
  const showList = focused && !selected;

  const handleChangeText = (text: string) => {
    // Digitar depois de escolher recomeça a busca.
    if (selected) onChange(null);
    setQuery(text);
  };

  const choose = (type: OccurrenceType) => {
    onChange(type);
    setQuery(OCCURRENCE_TYPE_BY_ID[type].label);
    Keyboard.dismiss();
  };

  const clear = () => {
    onChange(null);
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          selected && { borderColor: selected.color, backgroundColor: `${selected.color}10` },
        ]}>
        {selected ? (
          <Icon name={selected.icon} size={22} color={selected.color} />
        ) : (
          <Icon name="search" size={20} color={Brand.textMuted} />
        )}
        <TextInput
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Tipo de ocorrência (ex.: contramão, calçada…)"
          placeholderTextColor={Brand.textMuted}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (!selected && suggestions.length === 1) choose(suggestions[0].type.id);
          }}
          accessibilityLabel="Tipo de ocorrência"
          style={[styles.input, selected && styles.inputSelected]}
        />
        {query.length > 0 && (
          <Pressable
            onPress={clear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Limpar tipo">
            <Icon name="close" size={22} color={Brand.textMuted} />
          </Pressable>
        )}
      </View>

      {selected && <Text style={styles.selectedHint}>{selected.hint}</Text>}

      {showList && (
        <View style={styles.list}>
          {suggestions.length === 0 ? (
            <Text style={styles.empty}>
              Nenhum tipo encontrado. Tente “infração”, “condução perigosa” ou “bicicleta”.
            </Text>
          ) : (
            suggestions.map(({ type, matchedKeyword }, index) => (
              <Pressable
                key={type.id}
                onPress={() => choose(type.id)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.item,
                  index > 0 && styles.itemDivider,
                  pressed && styles.itemPressed,
                ]}>
                <View style={[styles.itemIcon, { backgroundColor: `${type.color}1F` }]}>
                  <Icon name={type.icon} size={20} color={type.color} />
                </View>
                <View style={styles.itemTexts}>
                  <Text style={styles.itemLabel}>{type.label}</Text>
                  <Text style={styles.itemHint} numberOfLines={1}>
                    {matchedKeyword ? `Corresponde a “${matchedKeyword}”` : type.hint}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Brand.border,
    backgroundColor: Brand.inputBackground,
  },
  fieldFocused: { borderColor: Brand.teal, backgroundColor: Brand.surface },
  input: { flex: 1, fontSize: 16, color: Brand.text, padding: 0 },
  inputSelected: { fontWeight: '600' },
  selectedHint: { fontSize: 13, color: Brand.textMuted, paddingHorizontal: 4 },

  list: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
    overflow: 'hidden',
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  itemDivider: { borderTopWidth: 1, borderTopColor: Brand.border },
  itemPressed: { backgroundColor: Brand.inputBackground },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTexts: { flex: 1, gap: 2 },
  itemLabel: { fontSize: 15, fontWeight: '600', color: Brand.text },
  itemHint: { fontSize: 13, color: Brand.textMuted },
  empty: { padding: 14, fontSize: 14, color: Brand.textMuted },
});
