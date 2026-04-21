import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { loyaltyApi } from '../../src/api/loyalty';
import { useAuthStore } from '../../src/store/auth';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';

const TIER_COLORS: Record<string, string> = { Bronze: '#cd7f32', Silver: '#aaa', Gold: '#ffd700', Platinum: '#e5e4e2' };
const TIER_EMOJI: Record<string, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

export default function LoyaltyScreen() {
  const { isAuthenticated } = useAuthStore();

  const { data: balance, isLoading: loadingBalance, refetch, isRefetching } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: loyaltyApi.getBalance,
    enabled: isAuthenticated,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['loyalty-history'],
    queryFn: loyaltyApi.getHistory,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return (
    <View style={styles.center}>
      <Text style={styles.emptyIcon}>⭐</Text>
      <Text style={styles.emptyTitle}>Programa de Fidelidade</Text>
      <Text style={styles.emptyText}>Faça login para ver seus pontos.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.btnText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loadingBalance) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;

  const tier = balance?.tier ?? 'Bronze';
  const tierColor = TIER_COLORS[tier] ?? '#cd7f32';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}>

      {/* Balance card */}
      <View style={[styles.balanceCard, { backgroundColor: tierColor }]}>
        <Text style={styles.tierEmoji}>{TIER_EMOJI[tier] ?? '⭐'}</Text>
        <Text style={styles.tierName}>{tier}</Text>
        <Text style={styles.pointsValue}>{balance?.points.toLocaleString('pt-BR') ?? 0}</Text>
        <Text style={styles.pointsLabel}>pontos</Text>
        {(balance?.nextTierPoints ?? 0) > 0 && (
          <Text style={styles.nextTier}>
            Faltam {balance!.nextTierPoints.toLocaleString('pt-BR')} pts para o próximo nível
          </Text>
        )}
      </View>

      {/* Tier benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Benefícios do Tier</Text>
        {[
          { tier: 'Bronze', desc: 'Acumule 1 ponto por R$1 gasto', pts: '0+' },
          { tier: 'Silver', desc: '1,5x pontos + acesso antecipado', pts: '1.000+' },
          { tier: 'Gold', desc: '2x pontos + descontos exclusivos', pts: '5.000+' },
          { tier: 'Platinum', desc: '3x pontos + VIP em eventos parceiros', pts: '15.000+' },
        ].map(t => (
          <View key={t.tier} style={[styles.tierRow, tier === t.tier && styles.tierRowActive]}>
            <Text style={styles.tierRowEmoji}>{TIER_EMOJI[t.tier]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierRowName}>{t.tier} <Text style={styles.tierRowPts}>({t.pts} pts)</Text></Text>
              <Text style={styles.tierRowDesc}>{t.desc}</Text>
            </View>
            {tier === t.tier && <Text style={styles.currentBadge}>Atual</Text>}
          </View>
        ))}
      </View>

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico</Text>
        {loadingHistory ? <ActivityIndicator color="#6200ea" /> : (history ?? []).length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma transação ainda.</Text>
        ) : (history ?? []).map(tx => (
          <View key={tx.id} style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDesc}>{tx.description}</Text>
              <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Text style={[styles.txPts, { color: tx.points > 0 ? '#4caf50' : '#e53935' }]}>
              {tx.points > 0 ? '+' : ''}{tx.points} pts
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  balanceCard: { padding: 32, alignItems: 'center', margin: 0 },
  tierEmoji: { fontSize: 48, marginBottom: 8 },
  tierName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  pointsValue: { fontSize: 52, fontWeight: '900', color: '#fff' },
  pointsLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  nextTier: { fontSize: 13, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  section: { backgroundColor: '#fff', margin: 0, marginTop: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 12 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tierRowActive: { backgroundColor: '#f3e5f5', borderRadius: 8, paddingHorizontal: 8 },
  tierRowEmoji: { fontSize: 22 },
  tierRowName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  tierRowPts: { fontWeight: '400', color: '#9e9e9e' },
  tierRowDesc: { fontSize: 12, color: '#616161', marginTop: 2 },
  currentBadge: { backgroundColor: '#6200ea', color: '#fff', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  txDesc: { fontSize: 14, color: '#212121' },
  txDate: { fontSize: 11, color: '#9e9e9e', marginTop: 2 },
  txPts: { fontSize: 15, fontWeight: '700' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#212121', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#6200ea', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
