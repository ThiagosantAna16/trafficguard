import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../src/config/firebase';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { usersApi } from '../../src/api/users';
import { Button } from '../../src/components/Button';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, setUser, setFirebaseUid } = useAuthStore();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUid(null);
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Erro', 'Não foi possível sair da conta.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Esta ação excluirá permanentemente sua conta, rotas e alertas. Não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await usersApi.deleteMe();
              await signOut(auth);
              setUser(null);
              setFirebaseUid(null);
              router.replace('/(auth)/login');
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a conta.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const isPro = user?.plan === 'pro';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Perfil</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
            <View style={styles.avatarGlow} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name ?? 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
          <View style={[
            styles.planBadge,
            isPro ? styles.planBadgePro : styles.planBadgeFree,
          ]}>
            <Text style={[styles.planText, isPro ? { color: colors.amber } : {}]}>
              {isPro ? '⚡ Pro' : '🆓 Free'}
            </Text>
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <StatItem value={`${user?.routesCount ?? 0}/3`} label="Rotas" icon="🛣️" />
          <View style={styles.statsDivider} />
          <StatItem value={isPro ? 'Pro' : 'Gratuito'} label="Plano" icon="💎" />
          <View style={styles.statsDivider} />
          <StatItem value="1.0.0" label="Versão" icon="📱" />
        </View>

        {/* Account section */}
        <SectionTitle title="Conta" />
        <View style={styles.settingsGroup}>
          <SettingsRow icon="👤" label="Nome" value={user?.name ?? '—'} />
          <View style={styles.rowDivider} />
          <SettingsRow icon="✉️" label="E-mail" value={user?.email ?? '—'} />
          <View style={styles.rowDivider} />
          <SettingsRow icon="📋" label="Plano atual" value={isPro ? 'Pro' : 'Gratuito'} />
        </View>

        {/* Notifications section */}
        <SectionTitle title="Notificações" />
        <View style={styles.settingsGroup}>
          <View style={styles.notifBox}>
            <Text style={styles.notifIcon}>🔔</Text>
            <Text style={styles.notifText}>
              Os alertas são enviados automaticamente pelo servidor, no horário configurado em cada rota — quando o trânsito superar a tolerância definida.
            </Text>
          </View>
        </View>

        {/* About section */}
        <SectionTitle title="Sobre" />
        <View style={styles.settingsGroup}>
          <SettingsRow icon="🚦" label="TrafficGuard" value="v1.0.0" />
          <View style={styles.rowDivider} />
          <SettingsRow icon="🗺️" label="Dados de tráfego" value="Google Maps" />
          <View style={styles.rowDivider} />
          <SettingsRow icon="⚙️" label="Backend" value="Node.js + Fastify" />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Sair da conta"
            icon="🚪"
            onPress={handleLogout}
            variant="outline"
          />
          <Button
            label={deletingAccount ? 'Excluindo...' : 'Excluir conta'}
            icon="🗑️"
            onPress={handleDeleteAccount}
            variant="danger"
            loading={deletingAccount}
          />
        </View>

        <Text style={styles.legal}>
          TrafficGuard  •  Dados de tráfego por Google Maps{'\n'}
          Feito com 💙 para facilitar seu dia a dia
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={secStyles.title}>{title}</Text>;
}

function SettingsRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={rowStyles.wrap}>
      <Text style={rowStyles.icon}>{icon}</Text>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 2 },
  icon: { fontSize: 20, marginBottom: 2 },
  value: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
});

const secStyles = StyleSheet.create({
  title: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
});

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  icon: { fontSize: 18, width: 24 },
  label: { flex: 1, fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  value: { fontSize: 14, color: colors.textPrimary, fontWeight: '700', maxWidth: '50%' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  scroll: { padding: 20, paddingBottom: 48, gap: 14 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 7,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primaryGlow,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  avatarText: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  userName: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  planBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  planBadgeFree: { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
  planBadgePro: { backgroundColor: colors.amberBg, borderColor: colors.amberBorder },
  planText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsDivider: { width: 1, height: 32, backgroundColor: colors.border },
  settingsGroup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  rowDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  notifBox: { flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' },
  notifIcon: { fontSize: 22, marginTop: 1 },
  notifText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  actions: { gap: 12, marginTop: 8 },
  legal: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
