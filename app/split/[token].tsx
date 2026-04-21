import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { splitApi } from '../../src/api/split';
import { useAuthStore } from '../../src/store/auth';

const STATUS_COLORS: Record<number, string> = { 0: '#2196F3', 1: '#4caf50', 2: '#9e9e9e', 3: '#e53935' };
const STATUS_LABELS: Record<number, string> = { 0: 'Aberto', 1: 'Completo', 2: 'Expirado', 3: 'Cancelado' };
const PART_COLORS: Record<number, string> = { 0: '#ff9800', 1: '#4caf50', 2: '#e53935' };
const PART_LABELS: Record<number, string> = { 0: 'Pendente', 1: 'Pago', 2: 'Expirado' };

export default function SplitScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: split, isLoading } = useQuery({
    queryKey: ['split', token],
    queryFn: () => splitApi.getByToken(token!),
    refetchInterval: 15000,
  });

  const joinMutation = useMutation({
    mutationFn: () => splitApi.joinAndPay(token!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['split', token] }),
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao entrar no racha.'),
  });

  const shareLink = () => {
    if (!split) return;
    const url = `https://tickly.app/split/${split.token}`;
    Share.share({ message: `Entre no racha do ingresso para ${split.eventTitle}!\n${url}`, url });
  };

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;
  if (!split) return <View style={styles.center}><Text>Racha não encontrado.</Text></View>;

  const myParticipant = split.participants.find(p => p.email === user?.email || p.name === user?.name);
  const isParticipant = !!myParticipant;
  const canJoin = split.status === 0 && !isParticipant && split.paidCount < split.maxParticipants;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eventTitle}>{split.eventTitle}</Text>
        <Text style={styles.ticketType}>{split.ticketTypeName} × {split.totalQuantity}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[split.status] }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[split.status]}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.card}>
        <View style={styles.row}><Text style={styles.label}>Total</Text><Text style={styles.value}>{split.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Por pessoa</Text><Text style={[styles.value, { color: '#6200ea', fontWeight: '800' }]}>{split.shareAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Pagos</Text><Text style={styles.value}>{split.paidCount}/{split.maxParticipants}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Expira</Text><Text style={styles.value}>{new Date(split.expiresAt).toLocaleString('pt-BR')}</Text></View>
      </View>

      {/* Participants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Participantes</Text>
        <View style={styles.grid}>
          {Array.from({ length: split.maxParticipants }).map((_, i) => {
            const p = split.participants[i];
            return (
              <View key={i} style={[styles.slot, p ? { borderColor: PART_COLORS[p.status] } : styles.slotEmpty]}>
                {p ? (
                  <>
                    <Text style={styles.slotName} numberOfLines={1}>{p.name || p.email || `#${i + 1}`}</Text>
                    <Text style={[styles.slotStatus, { color: PART_COLORS[p.status] }]}>{PART_LABELS[p.status]}</Text>
                  </>
                ) : (
                  <Text style={styles.slotPlaceholder}>Vaga livre</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      {split.status === 0 && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={shareLink}>
            <Text style={styles.shareBtnText}>🔗 Compartilhar Link</Text>
          </TouchableOpacity>
          {canJoin && (
            <TouchableOpacity style={styles.joinBtn} onPress={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? <ActivityIndicator color="#fff" /> :
                <Text style={styles.joinBtnText}>💳 Entrar e Pagar {split.shareAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>}
            </TouchableOpacity>
          )}
          {isParticipant && myParticipant?.status === 0 && (
            <Text style={styles.pendingHint}>Seu pagamento está pendente.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: { backgroundColor: '#6200ea', padding: 24, alignItems: 'center' },
  eventTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  ticketType: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 14, color: '#757575' },
  value: { fontSize: 14, color: '#212121', fontWeight: '600' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#212121' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { width: '47%', borderWidth: 2, borderRadius: 10, padding: 12, alignItems: 'center', minHeight: 64, justifyContent: 'center' },
  slotEmpty: { borderColor: '#e0e0e0', borderStyle: 'dashed' },
  slotName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2 },
  slotStatus: { fontSize: 11, fontWeight: '600' },
  slotPlaceholder: { fontSize: 12, color: '#bdbdbd' },
  actions: { marginHorizontal: 16, marginBottom: 32, gap: 12 },
  shareBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#6200ea', borderRadius: 10, padding: 14, alignItems: 'center' },
  shareBtnText: { color: '#6200ea', fontWeight: '700', fontSize: 15 },
  joinBtn: { backgroundColor: '#6200ea', borderRadius: 10, padding: 16, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pendingHint: { textAlign: 'center', color: '#ff9800', fontWeight: '600' },
});
