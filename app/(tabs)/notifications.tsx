import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, AppNotification } from '../../src/api/notifications';
import { useAuthStore } from '../../src/store/auth';
import { router } from 'expo-router';

function NotifItem({ item, onRead }: { item: AppNotification; onRead: (id: number) => void }) {
  const icons: Record<string, string> = { order: '🛒', ticket: '🎟', event: '🎪', system: '🔔', promo: '⚡' };
  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => { onRead(item.id); if (item.actionUrl) router.push(item.actionUrl as any); }}>
      <Text style={styles.itemIcon}>{icons[item.type] ?? '🔔'}</Text>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    enabled: isAuthenticated,
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!isAuthenticated) return (
    <View style={styles.center}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyText}>Faça login para ver notificações.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.btnText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;

  const unreadCount = (data ?? []).filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={() => markAll.mutate()}>
          <Text style={styles.markAllText}>Marcar todas como lidas ({unreadCount})</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={data ?? []}
        keyExtractor={n => String(n.id)}
        renderItem={({ item }) => <NotifItem item={item} onRead={id => markRead.mutate(id)} />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Sem notificações no momento.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  markAllBtn: { backgroundColor: '#ede7f6', padding: 12, alignItems: 'center' },
  markAllText: { color: '#6200ea', fontWeight: '700', fontSize: 13 },
  item: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  itemUnread: { backgroundColor: '#f3e5f5' },
  itemIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  itemMessage: { fontSize: 13, color: '#616161', marginBottom: 4 },
  itemDate: { fontSize: 11, color: '#9e9e9e' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6200ea', alignSelf: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#757575', textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#6200ea', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
