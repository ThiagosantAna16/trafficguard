import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/authStore';
import { usersApi } from '../../src/api/users';
import { pushApi } from '../../src/api/push';
import { clearToken } from '../../src/lib/session';
import { Button } from '../../src/components/Button';
import { LogOutIcon, BellIcon } from '../../src/components/Icon';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, clear, setUser } = useAuthStore();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const { sent } = await pushApi.sendTest();
      Alert.alert(
        sent ? 'Notificação enviada' : 'Sem dispositivo registrado',
        sent
          ? 'Deve aparecer no seu celular em alguns segundos.'
          : 'Nenhum token de push registrado. Abra o app no celular (APK), faça login e permita notificações.'
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a notificação de teste.');
    } finally {
      setTestingPush(false);
    }
  };

  // Reatualiza o perfil sempre que a aba ganha foco (ex.: após criar/excluir rota)
  useFocusEffect(
    useCallback(() => {
      usersApi.getMe().then(setUser).catch(() => {});
    }, [setUser])
  );

  const handleLogout = async () => {
    try {
      await clearToken();
      clear();
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
              await clearToken();
              clear();
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

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name ?? 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
          <View style={styles.planTag}>
            <Text style={styles.planText}>{isPro ? 'PRO' : 'FREE'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatItem value={`${user?.routesCount ?? 0}/3`} label="Rotas" />
          <StatItem value={isPro ? 'Pro' : 'Gratuito'} label="Plano" />
          <StatItem value="1.0.0" label="Versão" />
        </View>

        <SectionTitle title="Conta" />
        <View style={styles.settingsGroup}>
          <SettingsRow label="Nome" value={user?.name ?? '—'} />
          <SettingsRow label="E-mail" value={user?.email ?? '—'} />
          <SettingsRow label="Plano atual" value={isPro ? 'Pro' : 'Gratuito'} last />
        </View>

        <SectionTitle title="Notificações" />
        <Text style={styles.notifText}>
          Você recebe um aviso antes de cada saída — na antecedência configurada em cada rota — com o status do trânsito: normal ✅ ou com atraso ⚠️.
        </Text>
        <View style={{ marginTop: 12 }}>
          <Button
            label={testingPush ? 'Enviando...' : 'Enviar notificação de teste'}
            icon={<BellIcon color={colors.textPrimary} size={16} />}
            onPress={handleTestPush}
            loading={testingPush}
            variant="outline"
          />
        </View>

        <SectionTitle title="Sobre" />
        <View style={styles.settingsGroup}>
          <SettingsRow label="TrafficGuard" value="v1.0.0" />
          <SettingsRow label="Dados de tráfego" value="TomTom" />
          <SettingsRow label="Backend" value="Node.js + Fastify" last />
        </View>

        <View style={styles.actions}>
          <Button
            label="Sair da conta"
            icon={<LogOutIcon color={colors.textPrimary} />}
            onPress={handleLogout}
            variant="outline"
          />
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>{deletingAccount ? 'Excluindo...' : 'Excluir conta'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>TrafficGuard · Dados de tráfego por TomTom</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}
function SectionTitle({ title }: { title: string }) {
  return <Text style={secStyles.title}>{title}</Text>;
}
function SettingsRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[rowStyles.wrap, !last && rowStyles.divider]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center' },
  value: { fontFamily: fonts.mono, fontSize: 16, color: colors.textPrimary },
  label: { fontFamily: fonts.sansMedium, fontSize: 10.5, color: colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
});
const secStyles = StyleSheet.create({
  title: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
});
const rowStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary },
  value: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textPrimary, maxWidth: '55%' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  scroll: { padding: 24, paddingBottom: 48, gap: 24 },
  pageTitle: { fontFamily: fonts.serifSemiBold, fontSize: 25, color: colors.textPrimary },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 20 },
  avatar: { width: 48, height: 48, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.textPrimary },
  userName: { fontFamily: fonts.sansSemiBold, fontSize: 15.5, color: colors.textPrimary },
  userEmail: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  planTag: { borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 8, paddingVertical: 4 },
  planText: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary, letterSpacing: 0.4 },
  statsRow: { flexDirection: 'row' },
  settingsGroup: {},
  notifText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  actions: { gap: 10 },
  deleteBtn: { alignItems: 'center', paddingVertical: 10 },
  deleteText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.red },
  legal: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
});
