import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { seatMapApi, SeatDto } from '../../src/api/seat-map';

export default function SeatMapScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = Number(eventId);
  const [selected, setSelected] = useState<SeatDto[]>([]);
  const [reserving, setReserving] = useState(false);

  const { data: seatMap, isLoading } = useQuery({
    queryKey: ['seat-map', id],
    queryFn: () => seatMapApi.getByEvent(id),
  });

  const reserveMutation = useMutation({
    mutationFn: (seatIds: number[]) => seatMapApi.reserve(id, seatIds),
    onSuccess: (res) => {
      Alert.alert('✅ Reservado!',
        `${res.reservedSeats.length} assento(s) reservados por 10 minutos.\nFinalize a compra!`,
        [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.message || 'Erro ao reservar assentos.'),
  });

  const toggle = (seat: SeatDto) => {
    if (!seat.isAvailable) return;
    setSelected(prev => prev.find(s => s.id === seat.id)
      ? prev.filter(s => s.id !== seat.id)
      : prev.length >= 10 ? (Alert.alert('Máximo 10 assentos'), prev) : [...prev, seat]);
  };

  const isSelected = (id: number) => selected.some(s => s.id === id);
  const total = selected.reduce((s, seat) => s + seat.price, 0);

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;
  if (!seatMap) return <View style={styles.center}><Text>Mapa de assentos não encontrado.</Text></View>;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Legend */}
        <View style={styles.legend}>
          {seatMap.sections.map(s => (
            <View key={s.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendLabel}>{s.name} {s.price > 0 ? `(${s.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})` : '(Grátis)'}</Text>
            </View>
          ))}
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#bdbdbd' }]} /><Text style={styles.legendLabel}>Reservado/Vendido</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#1976d2' }]} /><Text style={styles.legendLabel}>Selecionado</Text></View>
        </View>

        {/* Stage */}
        <View style={styles.stage}><Text style={styles.stageText}>PALCO</Text></View>

        {/* Seat grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {seatMap.rows.map(rowData => (
              <View key={rowData.row} style={styles.row}>
                <Text style={styles.rowLabel}>{rowData.row}</Text>
                {rowData.seats.map(seat => (
                  <TouchableOpacity
                    key={seat.id}
                    style={[
                      styles.seat,
                      seat.isAvailable && !isSelected(seat.id) && { backgroundColor: seat.sectionColor + '99', borderColor: seat.sectionColor },
                      isSelected(seat.id) && styles.seatSelected,
                      !seat.isAvailable && styles.seatUnavailable,
                    ]}
                    onPress={() => toggle(seat)}
                    disabled={!seat.isAvailable}>
                    <Text style={[styles.seatText, isSelected(seat.id) && { color: '#fff' }]}>{seat.number}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.rowLabel}>{rowData.row}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.statItem}>🪑 {seatMap.totalSeats} total</Text>
          <Text style={styles.statItem}>✅ {seatMap.availableSeats} livres</Text>
          <Text style={styles.statItem}>🔴 {seatMap.soldSeats} vendidos</Text>
        </View>
      </ScrollView>

      {/* Summary bar */}
      {selected.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.selectedList} numberOfLines={1}>
              {selected.map(s => s.seatCode).join(', ')}
            </Text>
            <Text style={styles.totalText}>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          </View>
          <TouchableOpacity
            style={[styles.reserveBtn, reserveMutation.isPending && styles.reserveBtnDisabled]}
            onPress={() => reserveMutation.mutate(selected.map(s => s.id))}
            disabled={reserveMutation.isPending}>
            {reserveMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> :
              <Text style={styles.reserveBtnText}>Reservar ({selected.length})</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 2 },
  legendLabel: { fontSize: 11, color: '#616161' },
  stage: { backgroundColor: '#37474f', margin: 16, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  stageText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  rowLabel: { width: 20, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#9e9e9e' },
  seat: { width: 26, height: 26, borderRadius: 4, borderWidth: 1.5, borderColor: '#ccc', backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  seatSelected: { backgroundColor: '#1976d2', borderColor: '#0d47a1' },
  seatUnavailable: { backgroundColor: '#bdbdbd', borderColor: '#9e9e9e' },
  seatText: { fontSize: 9, fontWeight: '600', color: '#424242' },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: 20, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  statItem: { fontSize: 12, color: '#616161' },
  bottomBar: { flexDirection: 'row', backgroundColor: '#6200ea', padding: 16, justifyContent: 'space-between', alignItems: 'center' },
  selectedList: { color: 'rgba(255,255,255,0.8)', fontSize: 12, maxWidth: 180 },
  totalText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  reserveBtn: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  reserveBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.5)' },
  reserveBtnText: { color: '#6200ea', fontWeight: '700', fontSize: 14 },
});
