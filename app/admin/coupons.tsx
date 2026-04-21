import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, Coupon } from '../../src/api/admin';

function CouponCard({ coupon, onDelete }: { coupon: Coupon; onDelete: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.code}>{coupon.code}</Text>
        <View style={[styles.badge, { backgroundColor: coupon.isActive ? '#4caf50' : '#9e9e9e' }]}>
          <Text style={styles.badgeText}>{coupon.isActive ? 'Ativo' : 'Inativo'}</Text>
        </View>
      </View>
      <Text style={styles.discount}>
        {coupon.discountType === 0 ? `${coupon.discountValue}% de desconto` : `R$ ${coupon.discountValue} de desconto`}
      </Text>
      <Text style={styles.usage}>{coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''} usos</Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}><Text style={styles.deleteBtnText}>🗑 Excluir</Text></TouchableOpacity>
    </View>
  );
}

export default function CouponsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId ? Number(eventId) : undefined;
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState(0);
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['coupons', id],
    queryFn: () => adminApi.getCoupons(id),
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCoupon({
      code: code.toUpperCase(), discountType, discountValue: parseFloat(discountValue),
      maxUses: maxUses ? parseInt(maxUses) : undefined, eventId: id, isActive: true,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setShowModal(false); setCode(''); setDiscountValue(''); setMaxUses(''); },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar cupom.'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.createBtnText}>➕ Novo Cupom</Text>
      </TouchableOpacity>

      {isLoading ? <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 48 }} /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={c => String(c.id)}
          renderItem={({ item }) => <CouponCard coupon={item} onDelete={() =>
            Alert.alert('Excluir cupom', `Excluir "${item.code}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) }
            ])} />}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Nenhum cupom criado.</Text></View>}
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <ScrollView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Novo Cupom</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Código do Cupom</Text>
            <TextInput style={styles.input} value={code} onChangeText={c => setCode(c.toUpperCase())} placeholder="PROMO10" placeholderTextColor="#9e9e9e" autoCapitalize="characters" />
            <Text style={styles.label}>Tipo de Desconto</Text>
            <View style={styles.typeRow}>
              {[{ label: '% Percentual', v: 0 }, { label: 'R$ Fixo', v: 1 }].map(t => (
                <TouchableOpacity key={t.v} style={[styles.typeBtn, discountType === t.v && styles.typeBtnActive]} onPress={() => setDiscountType(t.v)}>
                  <Text style={[styles.typeBtnText, discountType === t.v && styles.typeBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Valor ({discountType === 0 ? '%' : 'R$'})</Text>
            <TextInput style={styles.input} value={discountValue} onChangeText={setDiscountValue} keyboardType="decimal-pad" placeholder={discountType === 0 ? '10' : '20.00'} placeholderTextColor="#9e9e9e" />
            <Text style={styles.label}>Máximo de Usos (vazio = ilimitado)</Text>
            <TextInput style={styles.input} value={maxUses} onChangeText={setMaxUses} keyboardType="number-pad" placeholder="100" placeholderTextColor="#9e9e9e" />
            <TouchableOpacity style={[styles.saveBtn, createMutation.isPending && styles.saveBtnDisabled]}
              onPress={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Criar Cupom</Text>}
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  code: { fontSize: 18, fontWeight: '900', color: '#6200ea', letterSpacing: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  discount: { fontSize: 14, color: '#212121', marginBottom: 2 },
  usage: { fontSize: 12, color: '#9e9e9e', marginBottom: 10 },
  deleteBtn: { alignSelf: 'flex-start' },
  deleteBtnText: { color: '#e53935', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 64 },
  emptyText: { fontSize: 15, color: '#757575' },
  modal: { flex: 1, backgroundColor: '#f5f5f5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#6200ea' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 20, color: '#fff' },
  modalBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 13, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, alignItems: 'center' },
  typeBtnActive: { borderColor: '#6200ea', backgroundColor: '#ede7f6' },
  typeBtnText: { fontSize: 13, color: '#616161', fontWeight: '600' },
  typeBtnTextActive: { color: '#6200ea' },
  saveBtn: { backgroundColor: '#6200ea', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { backgroundColor: '#9e9e9e' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
