import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../src/api/admin';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AnalyticsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = Number(eventId);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => adminApi.getAnalytics(id),
    enabled: !!id,
  });

  if (!id) return <View style={styles.center}><Text style={styles.emptyText}>Selecione um evento em "Meus Eventos".</Text></View>;
  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;
  if (!data) return <View style={styles.center}><Text style={styles.emptyText}>Sem dados de analytics.</Text></View>;

  const maxRev = Math.max(...(data.revenueByType ?? []).map(r => r.revenue), 1);
  const maxOrders = Math.max(...(data.ordersByDay ?? []).map(r => r.orders), 1);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}>
      {/* KPIs */}
      <View style={styles.grid}>
        {[
          { label: 'Receita Total', value: fmt(data.totalRevenue), color: '#4caf50' },
          { label: 'Total Pedidos', value: String(data.totalOrders), color: '#2196F3' },
          { label: 'Ingressos Vendidos', value: String(data.totalTicketsSold), color: '#9c27b0' },
        ].map(kpi => (
          <View key={kpi.label} style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Revenue by type */}
      {(data.revenueByType ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receita por Tipo</Text>
          {data.revenueByType.map(r => (
            <View key={r.name} style={styles.typeRow}>
              <Text style={styles.typeName} numberOfLines={1}>{r.name}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(r.revenue / maxRev) * 100}%` }]} />
              </View>
              <Text style={styles.typeValue}>{fmt(r.revenue)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Orders by day */}
      {(data.ordersByDay ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos por Dia</Text>
          <View style={styles.chart}>
            {data.ordersByDay.slice(-14).map(d => (
              <View key={d.date} style={styles.bar}>
                <Text style={styles.barLabel}>{d.orders}</Text>
                <View style={[styles.barCol, { height: Math.max(4, (d.orders / maxOrders) * 80) }]} />
                <Text style={styles.barDate}>{d.date.slice(5)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  grid: { flexDirection: 'row', gap: 10, padding: 16 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 1, alignItems: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  kpiLabel: { fontSize: 10, color: '#9e9e9e', textAlign: 'center' },
  section: { backgroundColor: '#fff', marginTop: 10, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 12 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typeName: { width: 80, fontSize: 12, color: '#424242' },
  barTrack: { flex: 1, height: 12, backgroundColor: '#f0f0f0', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#6200ea', borderRadius: 6 },
  typeValue: { width: 72, fontSize: 12, fontWeight: '700', color: '#212121', textAlign: 'right' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 120, justifyContent: 'center' },
  bar: { alignItems: 'center', gap: 2, flex: 1 },
  barLabel: { fontSize: 8, color: '#9e9e9e' },
  barCol: { width: '100%', backgroundColor: '#6200ea', borderRadius: 3 },
  barDate: { fontSize: 7, color: '#9e9e9e' },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center' },
});
