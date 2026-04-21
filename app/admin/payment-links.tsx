import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Share, Modal, TextInput, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../src/api/admin';

export default function PaymentLinksScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [eventId, setEventId] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['payment-links'],
    queryFn: adminApi.getPaymentLinks,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createPaymentLink({
      eventId: eventId ? parseInt(eventId) : undefined,
      ticketTypeId: ticketTypeId ? parseInt(ticketTypeId) : undefined,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      customMessage: customMessage || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-links'] }); setShowModal(false); },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar link.'),
  });

  const shareLink = (link: any) => {
    const url = `https://tickly.app/pay/${link.token}`;
    Share.share({ message: `Link para compra de ingresso:\n${url}`, url });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.createBtnText}>🔗 Novo Link de Pagamento</Text>
      </TouchableOpacity>
      {isLoading ? <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 48 }} /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={(l: any) => String(l.id)}
          renderItem={({ item }: any) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.token}>/{item.token}</Text>
                {item.eventTitle && <Text style={styles.meta}>{item.eventTitle}</Text>}
                {item.ticketTypeName && <Text style={styles.meta}>🎟 {item.ticketTypeName}</Text>}
                <Text style={styles.meta}>Usos: {item.useCount}{item.maxUses ? `/${item.maxUses}` : ''}</Text>
                <Text style={styles.meta}>Receita: {(item.totalRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={() => shareLink(item)}>
                <Text style={styles.shareBtnText}>↗️</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Nenhum link criado.</Text></View>}
        />
      )}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <ScrollView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Novo Link de Pagamento</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {[
              { label: 'ID do Evento', value: eventId, onChange: setEventId, placeholder: 'Ex: 3', type: 'number-pad' as const },
              { label: 'ID do Tipo de Ingresso', value: ticketTypeId, onChange: setTicketTypeId, placeholder: 'Ex: 7', type: 'number-pad' as const },
              { label: 'Máximo de Usos', value: maxUses, onChange: setMaxUses, placeholder: 'Vazio = ilimitado', type: 'number-pad' as const },
              { label: 'Mensagem Personalizada', value: customMessage, onChange: setCustomMessage, placeholder: 'Mensagem para o comprador', type: 'default' as const },
            ].map(f => (
              <View key={f.label}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput style={styles.input} value={f.value} onChangeText={f.onChange} keyboardType={f.type} placeholder={f.placeholder} placeholderTextColor="#9e9e9e" />
              </View>
            ))}
            <TouchableOpacity style={[styles.saveBtn, createMutation.isPending && styles.saveBtnDisabled]}
              onPress={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Criar Link</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  createBtn: { backgroundColor: '#6200ea', padding: 14, margin: 16, borderRadius: 10, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  token: { fontSize: 15, fontWeight: '700', color: '#6200ea', marginBottom: 4 },
  meta: { fontSize: 12, color: '#757575', marginBottom: 2 },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { fontSize: 18 },
  empty: { alignItems: 'center', paddingTop: 64 },
  emptyText: { fontSize: 15, color: '#757575' },
  modal: { flex: 1, backgroundColor: '#f5f5f5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#6200ea' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 20, color: '#fff' },
  modalBody: { padding: 20, gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 13, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },
  saveBtn: { backgroundColor: '#6200ea', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { backgroundColor: '#9e9e9e' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
