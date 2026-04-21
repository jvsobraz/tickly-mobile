import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resaleApi, TicketResale } from '../../src/api/resale';
import { useAuthStore } from '../../src/store/auth';

function ResaleCard({ item, onBuy }: { item: TicketResale; onBuy: () => void }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle}>{item.eventTitle}</Text>
        <Text style={styles.ticketType}>{item.ticketTypeName}</Text>
        <Text style={styles.serial}>#{item.ticketSerialNumber}</Text>
        <Text style={styles.seller}>Vendedor: {item.sellerName}</Text>
        <Text style={styles.original}>Original: {item.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.price}>{item.askingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        <TouchableOpacity style={styles.buyBtn} onPress={onBuy}>
          <Text style={styles.buyBtnText}>Comprar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ResaleScreen() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [eventId, setEventId] = useState('');
  const [searchId, setSearchId] = useState<number | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['resale', searchId],
    queryFn: () => resaleApi.listByEvent(searchId!),
    enabled: searchId != null,
  });

  const buyMutation = useMutation({
    mutationFn: resaleApi.buy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resale', searchId] });
      Alert.alert('✅', 'Ingresso comprado com sucesso!');
    },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao comprar.'),
  });

  const handleBuy = (item: TicketResale) => {
    if (!isAuthenticated) { Alert.alert('Login necessário', 'Faça login para comprar.'); return; }
    Alert.alert(
      'Confirmar compra',
      `${item.eventTitle}\n${item.ticketTypeName}\n\n${item.askingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Comprar', onPress: () => buyMutation.mutate(item.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={eventId}
          onChangeText={setEventId}
          placeholder="ID do Evento"
          placeholderTextColor="#9e9e9e"
          keyboardType="number-pad"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => setSearchId(eventId ? parseInt(eventId) : null)}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {searchId == null ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔄</Text>
          <Text style={styles.emptyTitle}>Mercado de Revenda</Text>
          <Text style={styles.emptyText}>Informe o ID do evento para ver ingressos disponíveis para revenda.</Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={r => String(r.id)}
          renderItem={({ item }) => <ResaleCard item={item} onBuy={() => handleBuy(item)} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Nenhum ingresso em revenda para este evento.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', elevation: 2 },
  searchInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },
  searchBtn: { backgroundColor: '#6200ea', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, flexDirection: 'row', gap: 12 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  ticketType: { fontSize: 12, color: '#6200ea', fontWeight: '600', marginBottom: 4 },
  serial: { fontSize: 11, color: '#9e9e9e', marginBottom: 2 },
  seller: { fontSize: 12, color: '#616161', marginBottom: 2 },
  original: { fontSize: 11, color: '#9e9e9e' },
  rightCol: { alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  price: { fontSize: 16, fontWeight: '800', color: '#6200ea' },
  buyBtn: { backgroundColor: '#6200ea', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center' },
});
