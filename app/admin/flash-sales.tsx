import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, FlashSale } from '../../src/api/admin';

function FlashCard({ item, onDelete }: { item: FlashSale; onDelete: () => void }) {
  return (
    <View style={[styles.card, item.isRunning && styles.cardRunning]}>
      {item.isRunning && <View style={styles.runningBadge}><Text style={styles.runningText}>⚡ AO VIVO</Text></View>}
      <Text style={styles.eventTitle}>{item.eventTitle}</Text>
      <Text style={styles.ticketType}>{item.ticketTypeName}</Text>
      <Text style={styles.flashPrice}>Flash: {item.flashPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
      <Text style={styles.period}>De {new Date(item.startAt).toLocaleString('pt-BR')} até {new Date(item.endAt).toLocaleString('pt-BR')}</Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}><Text style={styles.deleteBtnText}>🗑 Encerrar</Text></TouchableOpacity>
    </View>
  );
}

export default function FlashSalesScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = Number(eventId);
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [discountType, setDiscountType] = useState(0);
  const [discountValue, setDiscountValue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['flash-sales', id],
    queryFn: () => adminApi.getFlashSales(id),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createFlashSale({ ticketTypeId: parseInt(ticketTypeId), discountType, discountValue: parseFloat(discountValue), startAt, endAt }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flash-sales'] }); setShowModal(false); },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar flash sale.'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteFlashSale,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flash-sales'] }),
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.createBtnText}>⚡ Nova Flash Sale</Text>
      </TouchableOpacity>
      {isLoading ? <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 48 }} /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={f => String(f.id)}
          renderItem={({ item }) => <FlashCard item={item} onDelete={() =>
            Alert.alert('Encerrar', 'Encerrar esta flash sale?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Encerrar', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) }
            ])} />}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Nenhuma flash sale.</Text></View>}
        />
      )}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <ScrollView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Flash Sale</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>ID do Tipo de Ingresso</Text>
            <TextInput style={styles.input} value={ticketTypeId} onChangeText={setTicketTypeId} keyboardType="number-pad" placeholder="Ex: 5" placeholderTextColor="#9e9e9e" />
            <Text style={styles.label}>Tipo de Desconto</Text>
            <View style={styles.typeRow}>
              {[{ label: '% Percentual', v: 0 }, { label: 'R$ Fixo', v: 1 }].map(t => (
                <TouchableOpacity key={t.v} style={[styles.typeBtn, discountType === t.v && styles.typeBtnActive]} onPress={() => setDiscountType(t.v)}>
                  <Text style={[styles.typeBtnText, discountType === t.v && styles.typeBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Valor do Desconto</Text>
            <TextInput style={styles.input} value={discountValue} onChangeText={setDiscountValue} keyboardType="decimal-pad" placeholder="20" placeholderTextColor="#9e9e9e" />
            <Text style={styles.label}>Início (YYYY-MM-DDTHH:MM)</Text>
            <TextInput style={styles.input} value={startAt} onChangeText={setStartAt} placeholder="2026-12-01T18:00" placeholderTextColor="#9e9e9e" />
            <Text style={styles.label}>Fim (YYYY-MM-DDTHH:MM)</Text>
            <TextInput style={styles.input} value={endAt} onChangeText={setEndAt} placeholder="2026-12-01T20:00" placeholderTextColor="#9e9e9e" />
            <TouchableOpacity style={[styles.saveBtn, createMutation.isPending && styles.saveBtnDisabled]}
              onPress={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Criar Flash Sale</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  createBtn: { backgroundColor: '#f44336', padding: 14, margin: 16, borderRadius: 10, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#e0e0e0' },
  cardRunning: { borderLeftColor: '#f44336' },
  runningBadge: { backgroundColor: '#f44336', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 8 },
  runningText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#212121' },
  ticketType: { fontSize: 12, color: '#6200ea', marginBottom: 4 },
  flashPrice: { fontSize: 16, fontWeight: '800', color: '#f44336', marginBottom: 4 },
  period: { fontSize: 11, color: '#9e9e9e', marginBottom: 10 },
  deleteBtn: { alignSelf: 'flex-start' },
  deleteBtnText: { color: '#e53935', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 64 },
  emptyText: { fontSize: 15, color: '#757575' },
  modal: { flex: 1, backgroundColor: '#f5f5f5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#f44336' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 20, color: '#fff' },
  modalBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 13, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, alignItems: 'center' },
  typeBtnActive: { borderColor: '#f44336', backgroundColor: '#ffebee' },
  typeBtnText: { fontSize: 13, color: '#616161', fontWeight: '600' },
  typeBtnTextActive: { color: '#f44336' },
  saveBtn: { backgroundColor: '#f44336', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { backgroundColor: '#9e9e9e' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
