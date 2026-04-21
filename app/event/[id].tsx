import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { eventsApi } from '../../src/api/events';
import { ticketsApi } from '../../src/api/tickets';
import { useAuthStore } from '../../src/store/auth';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [paymentMethod, setPaymentMethod] = useState(0); // 0=Card, 1=Pix

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(Number(id)),
  });

  const createOrderMutation = useMutation({
    mutationFn: ticketsApi.createOrder,
    onSuccess: (order) => {
      Alert.alert('Pedido criado!', `Pedido #${order.id} criado. Total: ${order.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, [
        { text: 'OK' }
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar pedido.');
    }
  });

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;
  if (!event) return <Text style={{ textAlign: 'center', marginTop: 80 }}>Evento não encontrado.</Text>;

  const date = new Date(event.dateTime);

  const totalItems = Object.values(quantities).reduce((s, v) => s + (v ?? 0), 0);
  const totalAmount = event.ticketTypes.reduce((s, tt) => s + tt.price * (quantities[tt.id] ?? 0), 0);

  const buyTickets = () => {
    if (!isAuthenticated) {
      Alert.alert('Login necessário', 'Faça login para comprar ingressos.', [
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
        { text: 'Cancelar', style: 'cancel' }
      ]);
      return;
    }
    const items = event.ticketTypes
      .filter(tt => (quantities[tt.id] ?? 0) > 0)
      .map(tt => ({ ticketTypeId: tt.id, quantity: quantities[tt.id] }));
    createOrderMutation.mutate({ items, paymentMethod });
  };

  return (
    <ScrollView style={styles.container}>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Text style={{ fontSize: 64 }}>🎟</Text>
        </View>
      )}

      <View style={styles.body}>
        {event.category && <Text style={styles.category}>{event.category}</Text>}
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>📅 {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={styles.meta}>📍 {event.venue}, {event.city}/{event.state}</Text>
        <Text style={styles.meta}>👤 Organizado por {event.organizerName}</Text>

        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o Evento</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingressos</Text>
          {event.ticketTypes.map(tt => (
            <View key={tt.id} style={styles.ticketType}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ttName}>{tt.name}</Text>
                <Text style={styles.ttPrice}>
                  {tt.price === 0 ? 'Gratuito' : tt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
                <Text style={styles.ttAvail}>{tt.quantityAvailable} disponíveis</Text>
              </View>
              {tt.isActive && tt.quantityAvailable > 0 ? (
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantities(q => ({ ...q, [tt.id]: Math.max(0, (q[tt.id] ?? 0) - 1) }))}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{quantities[tt.id] ?? 0}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantities(q => ({ ...q, [tt.id]: Math.min(10, (q[tt.id] ?? 0) + 1) }))}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.soldOut}>Esgotado</Text>
              )}
            </View>
          ))}
        </View>

        {totalItems > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Forma de Pagamento</Text>
            <View style={styles.paymentRow}>
              {[{ label: '💳 Cartão', value: 0 }, { label: '⚡ PIX', value: 1 }].map(pm => (
                <TouchableOpacity
                  key={pm.value}
                  style={[styles.pmBtn, paymentMethod === pm.value && styles.pmBtnActive]}
                  onPress={() => setPaymentMethod(pm.value)}>
                  <Text style={[styles.pmBtnText, paymentMethod === pm.value && styles.pmBtnTextActive]}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total ({totalItems} ingresso{totalItems !== 1 ? 's' : ''})</Text>
              <Text style={styles.totalValue}>{totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
            </View>
            <TouchableOpacity
              style={[styles.buyBtn, createOrderMutation.isPending && styles.buyBtnDisabled]}
              onPress={buyTickets}
              disabled={createOrderMutation.isPending}>
              {createOrderMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buyBtnText}>🛒 Comprar Ingressos</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  hero: { width: '100%', height: 220 },
  heroPlaceholder: { backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20 },
  category: { fontSize: 12, color: '#6200ea', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 12 },
  metaRow: { marginBottom: 4 },
  meta: { fontSize: 14, color: '#616161', marginBottom: 6 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#212121', marginBottom: 12 },
  description: { fontSize: 14, color: '#424242', lineHeight: 22 },
  ticketType: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  ttName: { fontSize: 15, fontWeight: '600', color: '#212121' },
  ttPrice: { fontSize: 16, fontWeight: '700', color: '#6200ea', marginTop: 2 },
  ttAvail: { fontSize: 12, color: '#9e9e9e', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 20, color: '#6200ea', lineHeight: 22 },
  qtyValue: { fontSize: 18, fontWeight: '700', color: '#212121', minWidth: 24, textAlign: 'center' },
  soldOut: { color: '#e53935', fontWeight: '600', fontSize: 13 },
  summary: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  summaryTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, color: '#212121' },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pmBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center' },
  pmBtnActive: { borderColor: '#6200ea', backgroundColor: '#ede7f6' },
  pmBtnText: { fontSize: 14, color: '#616161', fontWeight: '600' },
  pmBtnTextActive: { color: '#6200ea' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  totalLabel: { fontSize: 15, color: '#424242' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#212121' },
  buyBtn: { backgroundColor: '#6200ea', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  buyBtnDisabled: { backgroundColor: '#9e9e9e' },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
