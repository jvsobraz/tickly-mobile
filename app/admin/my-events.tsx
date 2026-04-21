import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../src/api/admin';
import { EventItem } from '../../src/api/events';
import { router } from 'expo-router';

const STATUS_LABEL: Record<number, string> = { 0: 'Rascunho', 1: 'Ativo', 2: 'Encerrado', 3: 'Cancelado' };
const STATUS_COLOR: Record<number, string> = { 0: '#9e9e9e', 1: '#4caf50', 2: '#ff9800', 3: '#e53935' };

function EventCard({ event }: { event: EventItem }) {
  const date = new Date(event.dateTime);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[event.status] }]}>
          <Text style={styles.badgeText}>{STATUS_LABEL[event.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>📅 {date.toLocaleDateString('pt-BR')}</Text>
      <Text style={styles.cardMeta}>📍 {event.venue}, {event.city}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/admin/analytics?eventId=${event.id}`)}>
          <Text style={styles.actionBtnText}>📊 Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/admin/coupons?eventId=${event.id}`)}>
          <Text style={styles.actionBtnText}>🎟 Cupons</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/admin/flash-sales?eventId=${event.id}`)}>
          <Text style={styles.actionBtnText}>⚡ Flash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MyEventsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-events'],
    queryFn: adminApi.getMyEvents,
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/admin/create-event')}>
        <Text style={styles.createBtnText}>➕ Criar Novo Evento</Text>
      </TouchableOpacity>
      {isLoading ? <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 48 }} /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={e => String(e.id)}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Nenhum evento criado ainda.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  createBtn: { backgroundColor: '#6200ea', padding: 14, margin: 16, borderRadius: 10, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#212121', marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardMeta: { fontSize: 12, color: '#757575', marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: '#f3e5f5', borderRadius: 8, padding: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 11, color: '#6200ea', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 64 },
  emptyText: { fontSize: 15, color: '#757575' },
});
