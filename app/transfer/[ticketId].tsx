import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { transferApi } from '../../src/api/transfer';

export default function TransferScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () => transferApi.initiate(Number(ticketId), email.trim(), message.trim() || undefined),
    onSuccess: (data) => {
      Alert.alert('✅ Transferência iniciada!',
        `Um link foi enviado para ${data.toEmail}. O destinatário tem 48h para aceitar.`,
        [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao iniciar transferência.'),
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>↗️ Transferir Ingresso</Text>
          <Text style={styles.sub}>O destinatário receberá um e-mail com o link de aceite.</Text>

          <Text style={styles.label}>E-mail do destinatário *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="amigo@email.com"
            placeholderTextColor="#9e9e9e"
          />

          <Text style={styles.label}>Mensagem (opcional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Uma mensagem para o destinatário..."
            placeholderTextColor="#9e9e9e"
          />

          <TouchableOpacity
            style={[styles.btn, (!email.trim() || mutation.isPending) && styles.btnDisabled]}
            onPress={() => mutation.mutate()}
            disabled={!email.trim() || mutation.isPending}>
            {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enviar Transferência</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3 },
  title: { fontSize: 20, fontWeight: '800', color: '#212121', marginBottom: 6 },
  sub: { fontSize: 13, color: '#757575', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 13, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },
  btn: { backgroundColor: '#6200ea', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#bdbdbd' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { color: '#6200ea', fontWeight: '600', fontSize: 15 },
});
