import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueApi, QueueStatus } from '../../src/api/queue';

export default function QueueScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = Number(eventId);
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ['queue', id],
    queryFn: () => queueApi.getStatus(id),
    retry: false,
    refetchInterval: (q) => (q.state.data?.status === 1 ? false : 10000),
  });

  const joinMutation = useMutation({
    mutationFn: () => queueApi.join(id, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue', id] }),
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao entrar na fila.'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => queueApi.leave(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); router.back(); },
  });

  useEffect(() => {
    if (status?.status === 1 && status.secondsUntilExpiry) {
      setCountdown(status.secondsUntilExpiry);
      timerRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status?.status]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;

  // Not in queue
  if (!status || status.status === 3 || status.status === 4) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>🎟</Text>
        <Text style={styles.title}>Fila Virtual</Text>
        <Text style={styles.sub}>Entre na fila para garantir seus ingressos.</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyVal}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.min(10, q + 1))}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.qtyLabel}>{quantity} ingresso{quantity > 1 ? 's' : ''}</Text>
        <TouchableOpacity style={styles.mainBtn} onPress={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
          {joinMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Entrar na Fila</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // Active — user's turn
  if (status.status === 1) {
    const pct = countdown / ((status.secondsUntilExpiry ?? 600) + (600 - (status.secondsUntilExpiry ?? 0)));
    const circumference = 2 * Math.PI * 60;
    return (
      <View style={styles.center}>
        <Text style={styles.activeIcon}>🎉</Text>
        <Text style={styles.activeTitle}>Sua vez!</Text>
        <Text style={styles.activeSub}>{status.eventTitle}</Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(countdown)}</Text>
          <Text style={styles.timerLabel}>para expirar</Text>
        </View>
        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#4caf50' }]}
          onPress={() => router.push(`/event/${id}?queueToken=${status.accessToken}`)}>
          <Text style={styles.mainBtnText}>🛒 Comprar Agora</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.leaveBtn} onPress={() => leaveMutation.mutate()}>
          <Text style={styles.leaveBtnText}>Desistir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Waiting
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Aguardando</Text>
      <Text style={styles.sub}>{status.eventTitle}</Text>
      <View style={styles.posCard}>
        <Text style={styles.posValue}>{status.position}°</Text>
        <Text style={styles.posLabel}>posição na fila</Text>
        <Text style={styles.posTotal}>{status.totalInQueue} pessoa{status.totalInQueue !== 1 ? 's' : ''} aguardando</Text>
      </View>
      <Text style={styles.waitHint}>Você será notificado quando chegar sua vez.</Text>
      <TouchableOpacity style={styles.leaveBtn} onPress={() => Alert.alert('Sair da Fila', 'Deseja sair da fila?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => leaveMutation.mutate() }
      ])}>
        <Text style={styles.leaveBtnText}>Sair da Fila</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f5f5f5' },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#212121', marginBottom: 8 },
  sub: { fontSize: 15, color: '#757575', textAlign: 'center', marginBottom: 24 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 8 },
  qtyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 24, color: '#6200ea' },
  qtyVal: { fontSize: 28, fontWeight: '700', color: '#212121', minWidth: 40, textAlign: 'center' },
  qtyLabel: { fontSize: 14, color: '#757575', marginBottom: 28 },
  mainBtn: { backgroundColor: '#6200ea', borderRadius: 12, paddingHorizontal: 40, paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  mainBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  posCard: { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 20, width: '100%', elevation: 2 },
  posValue: { fontSize: 60, fontWeight: '900', color: '#6200ea' },
  posLabel: { fontSize: 16, color: '#424242', marginBottom: 4 },
  posTotal: { fontSize: 13, color: '#9e9e9e' },
  waitHint: { fontSize: 13, color: '#757575', textAlign: 'center', marginBottom: 24 },
  leaveBtn: { paddingVertical: 12 },
  leaveBtnText: { color: '#e53935', fontWeight: '600', fontSize: 15 },
  activeIcon: { fontSize: 72, marginBottom: 12 },
  activeTitle: { fontSize: 28, fontWeight: '900', color: '#4caf50', marginBottom: 6 },
  activeSub: { fontSize: 15, color: '#757575', marginBottom: 24, textAlign: 'center' },
  timerContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, width: '100%', elevation: 2 },
  timerText: { fontSize: 48, fontWeight: '900', color: '#212121', fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 13, color: '#9e9e9e' },
});
