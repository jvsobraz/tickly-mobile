import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { router, Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore(s => s.setAuth);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await setAuth(data, data.token);
      router.replace('/(tabs)/events');
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.response?.data?.error || err.response?.data?.message || 'E-mail ou senha inválidos.');
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🎟 Tickly</Text>
        <Text style={styles.subtitle}>Sua plataforma de ingressos</Text>

        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="seu@email.com"
            placeholderTextColor="#9e9e9e"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#9e9e9e"
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.btn, loginMutation.isPending && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}>
            {loginMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Entrar</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <Link href="/(auth)/register" style={styles.link}>Cadastrar-se</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 48, marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#757575', marginBottom: 40 },
  form: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },
  btn: { backgroundColor: '#6200ea', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#9e9e9e' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#757575', fontSize: 14 },
  link: { color: '#6200ea', fontWeight: '700', fontSize: 14 },
});
