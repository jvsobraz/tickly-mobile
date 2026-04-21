import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resaleApi, TicketResale } from '../../src/api/resale';
import { useAuthStore } from '../../src/store/auth';
import { router } from 'expo-router';

function ResaleCard({ item, onBuy, isBuying }: { item: TicketResale; onBuy: () => void; isBuying: boolean }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.eventTitle}</Text>
        <Text style={styles.typeName}>{item.ticketTypeName}</Text>
        <Text style={styles.date}>📅 {new Date(item.eventDateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.original}>{item.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          <Text style={styles.asking}>{item.askingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        </View>
        <Text style={styles.seller}>Vendido por: {item.sellerName}</Text>
      </View>
      <TouchableOpacity style={styles.buyBtn} onPress={onBuy} disabled={isBuying}>
        {isBuying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buyBtnText}>Comprar</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default function ResaleScreen() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['resale'],
    queryFn: resaleApi.list,
  });

  const buyMutation = useMutation({
    mutationFn: (id: number) => resaleApi.buy(id),
    onMutate: (id) => setBuyingId(id),
    onSuccess: () => {
      setBuyingId(null);
      qc.invalidateQueries({ queryKey: ['resale'] });
      Alert.alert('✅ Compra realizada!', 'O ingresso foi transferido para você.');
    },
    onError: (err: any) => {
      setBuyingId(null);
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao comprar ingresso.');
    },
  });

  const handleBuy = (item: TicketResale) => {
    if (!isAuthenticated) { router.push('/(auth)/login'); return; }
    Alert.alert('Confirmar Compra',
      `${item.eventTitle}\n${item.ticketTypeName}\n${item.askingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Comprar', onPress: () => buyMutation.mutate(item.id) }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎟 Revenda de Ingressos</Text>
        <Text style={styles.headerSub}>Ingressos verificados de outros compradores</Text>
      </View>
      {isLoading ? <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 48 }} /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => <ResaleCard item={item} onBuy={() => handleBuy(item)} isBuying={buyingId === item.id} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>🎟</Text><Text style={styles.emptyText}>Nenhum ingresso em revenda.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6200ea', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12, elevation: 2, alignItems: 'flex-end' },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 2 },
  typeName: { fontSize: 13, color: '#6200ea', fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 12, color: '#757575', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  original: { fontSize: 12, color: '#9e9e9e', textDecorationLine: 'line-through' },
  asking: { fontSize: 18, fontWeight: '800', color: '#4caf50' },
  seller: { fontSize: 11, color: '#9e9e9e' },
  buyBtn: { backgroundColor: '#6200ea', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#757575' },
});
