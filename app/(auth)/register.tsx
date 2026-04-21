import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { router, Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/auth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const setAuth = useAuthStore(s => s.setAuth);

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      await setAuth(data, data.token);
      router.replace('/(tabs)/events');
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.response?.data?.error || err.response?.data?.message || 'Erro ao criar conta.');
    },
  });

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e senha.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    registerMutation.mutate({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🎟 Tickly</Text>
        <Text style={styles.subtitle}>Crie sua conta gratuitamente</Text>

        <View style={styles.form}>
          {[
            { label: 'Nome completo', value: name, onChange: setName, placeholder: 'Seu nome', type: 'default' as const, secure: false },
            { label: 'E-mail', value: email, onChange: setEmail, placeholder: 'seu@email.com', type: 'email-address' as const, secure: false },
            { label: 'Telefone (opcional)', value: phone, onChange: setPhone, placeholder: '(11) 99999-9999', type: 'phone-pad' as const, secure: false },
            { label: 'Senha', value: password, onChange: setPassword, placeholder: 'Mínimo 6 caracteres', type: 'default' as const, secure: true },
            { label: 'Confirmar senha', value: confirm, onChange: setConfirm, placeholder: 'Repita a senha', type: 'default' as const, secure: true },
          ].map((field) => (
            <View key={field.label}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.onChange}
                keyboardType={field.type}
                autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                secureTextEntry={field.secure}
                placeholder={field.placeholder}
                placeholderTextColor="#9e9e9e"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, registerMutation.isPending && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={registerMutation.isPending}>
            {registerMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Criar Conta</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <Link href="/(auth)/login" style={styles.link}>Entrar</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 48, marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#757575', marginBottom: 32 },
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
