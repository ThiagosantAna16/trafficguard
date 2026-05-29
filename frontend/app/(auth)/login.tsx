import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../../src/config/firebase';
import { colors } from '../../src/theme/colors';
import { Button } from '../../src/components/Button';

export default function LoginScreen() {
  const router = useRouter();
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
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name) { Alert.alert('Nome obrigatório', 'Informe seu nome.'); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace('/(app)');
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'E-mail já cadastrado.',
        'auth/weak-password': 'Senha fraca — mín. 6 caracteres.',
        'auth/invalid-email': 'E-mail inválido.',
      };
      Alert.alert('Erro', msgs[err.code] ?? err.message);
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

        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🚦</Text>
          </View>
          <Text style={styles.appName}>TrafficGuard</Text>
          <Text style={styles.tagline}>Saia no momento certo. Sempre.</Text>
        </View>

        {/* Toggle login / register */}
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

        {/* Form card */}
        <View style={styles.formCard}>
          {mode === 'register' && (
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>👤  Nome completo</Text>
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
            <Text style={styles.fieldLabel}>✉️  E-mail</Text>
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
            <Text style={styles.fieldLabel}>🔒  Senha</Text>
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
          Ao continuar você concorda com nossos Termos de Uso e Política de Privacidade.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.darkBg },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 36 },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: { fontSize: 44 },
  appName: { fontSize: 30, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 11 },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  toggleTextActive: { color: colors.textDark },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  terms: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 18,
  },
});
