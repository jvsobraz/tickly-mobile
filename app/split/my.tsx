import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { splitApi, SplitPayment } from '../../src/api/split';

function SplitCard({ item }: { item: SplitPayment }) {
  const statusColor = item.status === 2 ? '#4caf50' : item.status === 1 ? '#6200ea' : '#9e9e9e';
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/split/${item.token}`)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle}>{item.eventTitle}</Text>
        <Text style={styles.ticketType}>{item.ticketTypeName}</Text>
        <Text style={styles.meta}>
          {item.paidCount}/{item.maxParticipants} pagaram · {item.shareAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cada
        </Text>
        <Text style={styles.meta}>Total: {item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        <Text style={styles.expires}>Expira {new Date(item.expiresAt).toLocaleDateString('pt-BR')}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{item.statusLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MySplitsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-splits'],
    queryFn: splitApi.getMy,
  });

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={s => String(s.id)}
      renderItem={({ item }) => <SplitCard item={item} />}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyTitle}>Nenhum racha</Text>
          <Text style={styles.emptyText}>Seus rachas de pagamento aparecem aqui.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 2 },
  ticketType: { fontSize: 13, color: '#6200ea', fontWeight: '600', marginBottom: 6 },
  meta: { fontSize: 12, color: '#616161', marginBottom: 2 },
  expires: { fontSize: 11, color: '#9e9e9e', marginTop: 4 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center' },
});
