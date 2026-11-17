import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Brand, BrandShadow } from '@/constants/brand';
import { formatDecimal, t } from '@/i18n';

/** Dados fixos do protótipo, até existir login/backend. */
const PROFILE = {
  name: 'Lucas Almeida',
  contact: 'lucas.almeida@email.com',
  rating: 4.8,
};

const AVATAR_SIZE = 150;
const DANGER_TEXT = '#C62828';

/** Tela 8 do protótipo: perfil do usuário (somente leitura por enquanto). */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const signOut = () => {
    Alert.alert(t.profile.signOut, t.profile.signOutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.profile.signOut, onPress: goBack },
    ]);
  };

  const deleteAccount = () => {
    Alert.alert(
      t.profile.deleteAccount,
      t.profile.deleteAccountConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.profile.delete, style: 'destructive', onPress: goBack },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Icon name="back" size={20} color={Brand.text} />
        </Pressable>
        <Text style={styles.title}>{t.profile.title}</Text>
        {/* Espaço simétrico ao botão de voltar para centralizar o título. */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Icon name="person" size={72} color={Brand.textMuted} />
          </View>
          <View style={styles.cameraBadge}>
            <Icon name="camera" size={20} color={Brand.mintText} />
          </View>
        </View>

        <View
          style={styles.ratingRow}
          accessible
          accessibilityLabel={t.profile.ratingA11y(formatDecimal(PROFILE.rating, 1))}>
          <Icon name="star" size={30} color={Brand.amber} />
          <Text style={styles.ratingValue}>{formatDecimal(PROFILE.rating, 1)}</Text>
          <Text style={styles.ratingLabel}>{t.profile.rating}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t.profile.name}</Text>
          <View style={styles.field}>
            <Text style={styles.fieldText} numberOfLines={1}>
              {PROFILE.name}
            </Text>
          </View>

          <Text style={[styles.label, styles.labelSpaced]}>{t.profile.contact}</Text>
          <View style={styles.field}>
            <Text style={styles.fieldText} numberOfLines={1}>
              {PROFILE.contact}
            </Text>
          </View>
        </View>

        <View style={styles.flexSpacer} />

        <View style={styles.actions}>
          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={styles.signOut}>{t.profile.signOut}</Text>
          </Pressable>
          <Pressable
            onPress={deleteAccount}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={styles.deleteAccount}>{t.profile.deleteAccount}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.canvas },
  pressed: { opacity: 0.6 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    ...BrandShadow,
    shadowOpacity: 0.06,
  },
  headerSpacer: { width: 46 },
  title: { fontSize: 20, fontWeight: '700', color: Brand.text },

  content: { flexGrow: 1, paddingHorizontal: 32 },

  avatarWrap: {
    alignSelf: 'center',
    marginTop: 28,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: Brand.mint,
    backgroundColor: '#E6ECF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.mint,
    borderWidth: 3,
    borderColor: Brand.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
  },
  ratingValue: { fontSize: 26, fontWeight: '700', color: Brand.text },
  ratingLabel: { fontSize: 17, color: Brand.textMuted },

  form: { marginTop: 48 },
  label: { fontSize: 15, fontWeight: '600', color: Brand.textMuted, marginBottom: 8 },
  labelSpaced: { marginTop: 24 },
  field: {
    height: 56,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 20,
  },
  fieldText: { fontSize: 17, color: Brand.text },

  flexSpacer: { flex: 1, minHeight: 48 },

  actions: { gap: 22 },
  signOut: { fontSize: 19, fontWeight: '700', color: Brand.text },
  deleteAccount: { fontSize: 16, fontWeight: '600', color: DANGER_TEXT },
});
