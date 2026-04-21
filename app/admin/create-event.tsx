import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { adminApi, CreateEventRequest } from '../../src/api/admin';

const CATEGORIES = ['Show', 'Festival', 'Teatro', 'Esporte', 'Conferência', 'Workshop', 'Exposição', 'Outro'];
const BR_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function CreateEventScreen() {
  const [form, setForm] = useState<CreateEventRequest>({
    title: '', description: '', dateTime: '', venue: '',
    address: '', city: '', state: 'SP', category: 'Show', imageUrl: '',
  });
  const [ttName, setTtName] = useState('Pista');
  const [ttPrice, setTtPrice] = useState('');
  const [ttQty, setTtQty] = useState('');

  const set = (key: keyof CreateEventRequest) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const event = await adminApi.createEvent(form);
      if (ttName && ttQty) {
        await adminApi.addTicketType(event.id, {
          name: ttName, price: parseFloat(ttPrice) || 0, quantity: parseInt(ttQty),
        });
      }
      return event;
    },
    onSuccess: () => {
      Alert.alert('✅ Evento criado!', 'Seu evento foi publicado com sucesso.', [
        { text: 'OK', onPress: () => router.replace('/admin/my-events') }
      ]);
    },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar evento.'),
  });

  const handleCreate = () => {
    if (!form.title || !form.dateTime || !form.venue || !form.city) {
      Alert.alert('Atenção', 'Preencha título, data, local e cidade.'); return;
    }
    createMutation.mutate();
  };

  const Field = ({ label, value, onChange, placeholder, keyboardType = 'default', multiline = false }: any) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#9e9e9e" keyboardType={keyboardType} multiline={multiline} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Evento</Text>
          <Field label="Título *" value={form.title} onChange={set('title')} placeholder="Nome do evento" />
          <Field label="Descrição" value={form.description} onChange={set('description')} placeholder="Descreva o evento..." multiline />
          <Field label="Data e Hora * (YYYY-MM-DDTHH:MM)" value={form.dateTime} onChange={set('dateTime')} placeholder="2026-12-31T20:00" />
          <Field label="URL da Imagem" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local</Text>
          <Field label="Local/Venue *" value={form.venue} onChange={set('venue')} placeholder="Arena XYZ" />
          <Field label="Endereço" value={form.address} onChange={set('address')} placeholder="Rua, número" />
          <Field label="Cidade *" value={form.city} onChange={set('city')} placeholder="São Paulo" />
          <Text style={styles.label}>Estado</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
              {BR_STATES.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, form.state === s && styles.chipActive]} onPress={() => set('state')(s)}>
                  <Text style={[styles.chipText, form.state === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria</Text>
          <View style={styles.chipWrap}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => set('category')(c)}>
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Ingresso (1º lote)</Text>
          <Field label="Nome" value={ttName} onChange={setTtName} placeholder="Pista, VIP..." />
          <Field label="Preço (R$)" value={ttPrice} onChange={setTtPrice} placeholder="0.00 para gratuito" keyboardType="decimal-pad" />
          <Field label="Quantidade" value={ttQty} onChange={setTtQty} placeholder="100" keyboardType="number-pad" />
        </View>

        <View style={{ padding: 20, paddingBottom: 40 }}>
          <TouchableOpacity style={[styles.createBtn, createMutation.isPending && styles.createBtnDisabled]}
            onPress={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>✅ Criar Evento</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { backgroundColor: '#fff', margin: 0, marginTop: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 13, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive: { borderColor: '#6200ea', backgroundColor: '#ede7f6' },
  chipText: { fontSize: 13, color: '#616161' },
  chipTextActive: { color: '#6200ea', fontWeight: '700' },
  createBtn: { backgroundColor: '#6200ea', borderRadius: 12, padding: 16, alignItems: 'center' },
  createBtnDisabled: { backgroundColor: '#9e9e9e' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
