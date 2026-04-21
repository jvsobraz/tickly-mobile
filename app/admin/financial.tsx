import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { financialApi } from '../../src/api/financial';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FinancialScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => financialApi.getSummary(),
  });
  const { data: payouts, isLoading: loadingPayouts } = useQuery({
    queryKey: ['payouts'],
    queryFn: financialApi.getPayouts,
  });
  const { data: revenue } = useQuery({
    queryKey: ['revenue'],
    queryFn: () => financialApi.getRevenue('daily'),
  });

  const STATUS_COLOR: Record<number, string> = { 0: '#ff9800', 1: '#2196F3', 2: '#4caf50', 3: '#e53935', 4: '#9e9e9e' };
  const STATUS_LABEL: Record<number, string> = { 0: 'Pendente', 1: 'Em Processamento', 2: 'Concluído', 3: 'Falhou', 4: 'Rejeitado' };

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}>
      {/* Balance highlight */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Disponível</Text>
        <Text style={styles.balanceValue}>{fmt(data?.availableBalance ?? 0)}</Text>
        <Text style={styles.balanceSub}>Após taxas da plataforma (5%)</Text>
      </View>

      {/* Summary grid */}
      <View style={styles.grid}>
        {[
          { label: 'Receita Bruta', value: fmt(data?.grossRevenue ?? 0), color: '#4caf50' },
          { label: 'Descontos', value: fmt(data?.totalDiscounts ?? 0), color: '#ff9800' },
          { label: 'Reembolsos', value: fmt(data?.totalRefunds ?? 0), color: '#e53935' },
          { label: 'Receita Líquida', value: fmt(data?.netRevenue ?? 0), color: '#2196F3' },
          { label: 'Taxa Plataforma', value: fmt(data?.platformFee ?? 0), color: '#9c27b0' },
          { label: 'Ingressos Vendidos', value: String(data?.totalTicketsSold ?? 0), color: '#212121' },
        ].map(item => (
          <View key={item.label} style={styles.gridCard}>
            <Text style={[styles.gridValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent revenue */}
      {(revenue ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receita Recente</Text>
          {(revenue ?? []).slice(-7).reverse().map(r => (
            <View key={r.period} style={styles.revenueRow}>
              <Text style={styles.revPeriod}>{r.period}</Text>
              <Text style={styles.revOrders}>{r.orders} pedidos</Text>
              <Text style={styles.revValue}>{fmt(r.revenue)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Payouts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repasses</Text>
        {loadingPayouts ? <ActivityIndicator color="#6200ea" /> : (payouts ?? []).length === 0 ? (
          <Text style={styles.emptyText}>Nenhum repasse solicitado.</Text>
        ) : (payouts ?? []).map(p => (
          <View key={p.id} style={styles.payoutRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.payoutAmount}>{fmt(p.amount)}</Text>
              <Text style={styles.payoutDate}>{new Date(p.requestedAt).toLocaleDateString('pt-BR')}</Text>
              {p.eventTitle && <Text style={styles.payoutEvent}>{p.eventTitle}</Text>}
            </View>
            <View style={[styles.payoutBadge, { backgroundColor: STATUS_COLOR[p.status] }]}>
              <Text style={styles.payoutBadgeText}>{STATUS_LABEL[p.status]}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  balanceCard: { backgroundColor: '#6200ea', padding: 32, alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  balanceValue: { fontSize: 40, fontWeight: '900', color: '#fff' },
  balanceSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  gridCard: { width: '47%', backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 1 },
  gridValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  gridLabel: { fontSize: 11, color: '#9e9e9e' },
  section: { backgroundColor: '#fff', marginTop: 10, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 12 },
  revenueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  revPeriod: { flex: 1, fontSize: 13, color: '#424242' },
  revOrders: { fontSize: 12, color: '#9e9e9e', marginRight: 12 },
  revValue: { fontSize: 14, fontWeight: '700', color: '#4caf50' },
  payoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  payoutAmount: { fontSize: 16, fontWeight: '700', color: '#212121' },
  payoutDate: { fontSize: 11, color: '#9e9e9e', marginTop: 2 },
  payoutEvent: { fontSize: 12, color: '#616161' },
  payoutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  payoutBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#9e9e9e', textAlign: 'center', paddingVertical: 12 },
});
