import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { Button } from '../../src/components/Button';
import { MailIcon, LockIcon } from '../../src/components/Icon';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/stores/authStore';
import { setToken as persistToken } from '../../src/lib/session';
import { registerForPushNotificationsAsync } from '../../src/utils/notifications';

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }
    if (mode === 'register' && !name) {
      Alert.alert('Nome obrigatório', 'Informe seu nome.');
      return;
    }

    setLoading(true);
    try {
      const pushToken = (await registerForPushNotificationsAsync()) ?? undefined;

      const { token, user } =
        mode === 'register'
          ? await authApi.register({ name, email, password, pushToken })
          : await authApi.login({ email, password, pushToken });

      await persistToken(token);
      setSession(token, user);
      router.replace('/(app)');
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Não foi possível concluir. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Image source={require('../../assets/logo-mark.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>TrafficGuard</Text>
          <Text style={styles.tagline}>Saia no momento certo. Sempre.</Text>
        </View>

        <View style={styles.toggle}>
          {(['login', 'register'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          {mode === 'register' && (
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <TextInput
                style={inputStyle('name')}
                placeholder="Seu nome"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          )}

          <View style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
              <MailIcon size={13} color={colors.textMuted} />
              <Text style={styles.fieldLabel}>E-mail</Text>
            </View>
            <TextInput
              style={inputStyle('email')}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
              <LockIcon size={13} color={colors.textMuted} />
              <Text style={styles.fieldLabel}>Senha</Text>
            </View>
            <TextInput
              style={inputStyle('password')}
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <Button
            label={mode === 'login' ? 'Entrar na conta' : 'Criar minha conta'}
            onPress={handleEmailAuth}
            loading={loading}
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>

        <Text style={styles.terms}>
          Ao continuar você concorda com os Termos de Uso e a Política de Privacidade.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.darkBg },
  scroll: { flexGrow: 1, padding: 32, justifyContent: 'center' },
  header: { marginBottom: 40 },
  logo: { width: 44, height: 44, marginBottom: 14 },
  appName: { fontFamily: fonts.serifSemiBold, fontSize: 27, color: colors.textPrimary, letterSpacing: -0.3 },
  tagline: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted, marginTop: 6, letterSpacing: 0.3 },
  toggle: {
    flexDirection: 'row',
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 28,
  },
  toggleBtn: { paddingBottom: 12 },
  toggleActive: { borderBottomWidth: 2, borderBottomColor: colors.accent, marginBottom: -1 },
  toggleText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textMuted },
  toggleTextActive: { fontFamily: fonts.sansSemiBold, color: colors.textPrimary },
  form: { gap: 22 },
  fieldWrap: { gap: 8 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    paddingBottom: 10,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputFocused: { borderBottomColor: colors.accent },
  terms: {
    fontFamily: fonts.sans,
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 18,
  },
});
