import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../src/api/events';
import { ticketsApi } from '../../src/api/tickets';
import { reviewsApi, Review } from '../../src/api/reviews';
import { waitlistApi } from '../../src/api/waitlist';
import { splitApi } from '../../src/api/split';
import { useAuthStore } from '../../src/store/auth';

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <TouchableOpacity key={s} onPress={() => onRate?.(s)} disabled={!onRate}>
          <Text style={{ fontSize: 22, color: s <= rating ? '#f9a825' : '#e0e0e0' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewName}>{review.userName}</Text>
        <StarRating rating={review.rating} />
      </View>
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
      <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</Text>
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [paymentMethod, setPaymentMethod] = useState(0);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitTicketTypeId, setSplitTicketTypeId] = useState(0);
  const [splitParticipants, setSplitParticipants] = useState('2');
  const [splitQtyPer, setSplitQtyPer] = useState('1');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(Number(id)),
  });

  const { data: reviewData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewsApi.getByEvent(Number(id)),
    enabled: !!id,
  });

  const createOrderMutation = useMutation({
    mutationFn: ticketsApi.createOrder,
    onSuccess: (order) => {
      Alert.alert(
        'Pedido criado!',
        `Pedido #${order.id} criado.\nTotal: ${order.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        [{ text: 'Ver Meus Ingressos', onPress: () => router.push('/(tabs)/my-tickets') }, { text: 'OK' }]
      );
      setQuantities({});
    },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar pedido.'),
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: ({ ticketTypeId, quantity }: { ticketTypeId: number; quantity: number }) =>
      waitlistApi.join(ticketTypeId, quantity),
    onSuccess: () => Alert.alert('✅ Lista de Espera', 'Você foi adicionado à lista de espera!'),
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao entrar na lista.'),
  });

  const createReviewMutation = useMutation({
    mutationFn: () => reviewsApi.create(Number(id), reviewRating, reviewComment || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', id] });
      setReviewComment('');
      Alert.alert('✅', 'Avaliação enviada!');
    },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao enviar avaliação.'),
  });

  const createSplitMutation = useMutation({
    mutationFn: () => splitApi.create(splitTicketTypeId, parseInt(splitParticipants), parseInt(splitQtyPer)),
    onSuccess: (split) => {
      setShowSplitModal(false);
      router.push(`/split/${split.token}`);
    },
    onError: (err: any) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar racha.'),
  });

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;
  if (!event) return <Text style={{ textAlign: 'center', marginTop: 80 }}>Evento não encontrado.</Text>;

  const date = new Date(event.dateTime);
  const totalItems = Object.values(quantities).reduce((s, v) => s + (v ?? 0), 0);
  const totalAmount = (event.ticketTypes ?? []).reduce((s, tt) => s + tt.price * (quantities[tt.id] ?? 0), 0);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      Alert.alert('Login necessário', 'Faça login para continuar.', [
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    action();
  };

  const buyTickets = () => requireAuth(() => {
    const items = (event.ticketTypes ?? [])
      .filter(tt => (quantities[tt.id] ?? 0) > 0)
      .map(tt => ({ ticketTypeId: tt.id, quantity: quantities[tt.id] }));
    createOrderMutation.mutate({ items, paymentMethod });
  });

  const hasSoldOut = (event.ticketTypes ?? []).some(tt => tt.isActive && tt.quantityAvailable === 0);

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

        <Text style={styles.meta}>📅 {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text style={styles.meta}>📍 {event.venue}, {event.city}/{event.state}</Text>
        <Text style={styles.meta}>👤 Organizado por {event.organizerName}</Text>

        <View style={styles.actionChips}>
          <TouchableOpacity style={styles.chip} onPress={() => router.push(`/seat-map/${id}`)}>
            <Text style={styles.chipText}>🪑 Mapa de Assentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => router.push(`/queue/${id}`)}>
            <Text style={styles.chipText}>⏳ Fila Virtual</Text>
          </TouchableOpacity>
        </View>

        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o Evento</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingressos</Text>
          {(event.ticketTypes ?? []).map(tt => {
            const qty = quantities[tt.id] ?? 0;
            const soldOut = tt.isActive && tt.quantityAvailable === 0;
            return (
              <View key={tt.id} style={styles.ticketType}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ttName}>{tt.name}</Text>
                  <Text style={styles.ttPrice}>
                    {tt.price === 0 ? 'Gratuito' : tt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                  <Text style={styles.ttAvail}>{tt.quantityAvailable} disponíveis</Text>
                </View>
                {soldOut ? (
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.soldOut}>Esgotado</Text>
                    <TouchableOpacity
                      style={styles.waitlistBtn}
                      onPress={() => requireAuth(() => joinWaitlistMutation.mutate({ ticketTypeId: tt.id, quantity: 1 }))}>
                      <Text style={styles.waitlistBtnText}>📋 Lista de Espera</Text>
                    </TouchableOpacity>
                  </View>
                ) : tt.isActive ? (
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQuantities(q => ({ ...q, [tt.id]: Math.max(0, (q[tt.id] ?? 0) - 1) }))}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQuantities(q => ({ ...q, [tt.id]: Math.min(10, (q[tt.id] ?? 0) + 1) }))}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.soldOut}>Indisponível</Text>
                )}
              </View>
            );
          })}
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
            <TouchableOpacity
              style={styles.splitBtn}
              onPress={() => requireAuth(() => {
                setSplitTicketTypeId((event.ticketTypes ?? []).find(tt => (quantities[tt.id] ?? 0) > 0)?.id ?? (event.ticketTypes ?? [])[0]?.id ?? 0);
                setShowSplitModal(true);
              })}>
              <Text style={styles.splitBtnText}>💳 Rachar com Amigos</Text>
            </TouchableOpacity>
          </View>
        )}

        {reviewData && (
          <View style={styles.section}>
            <View style={styles.reviewSummaryRow}>
              <Text style={styles.sectionTitle}>Avaliações</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.avgRating}>{reviewData.averageRating.toFixed(1)} ★</Text>
                <Text style={styles.totalReviews}>{reviewData.totalReviews} avaliação{reviewData.totalReviews !== 1 ? 'ões' : ''}</Text>
              </View>
            </View>

            {reviewData.reviews.slice(0, 3).map(r => <ReviewCard key={r.id} review={r} />)}

            {isAuthenticated && (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormTitle}>Sua Avaliação</Text>
                <StarRating rating={reviewRating} onRate={setReviewRating} />
                <TextInput
                  style={styles.reviewInput}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Comentário (opcional)..."
                  placeholderTextColor="#9e9e9e"
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={[styles.reviewSubmit, createReviewMutation.isPending && { backgroundColor: '#9e9e9e' }]}
                  onPress={() => createReviewMutation.mutate()}
                  disabled={createReviewMutation.isPending}>
                  {createReviewMutation.isPending
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.reviewSubmitText}>Enviar Avaliação</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <Modal visible={showSplitModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSplitModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💳 Rachar com Amigos</Text>
            <TouchableOpacity onPress={() => setShowSplitModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.label}>Tipo de Ingresso</Text>
            {(event.ticketTypes ?? []).filter(tt => tt.isActive && tt.quantityAvailable > 0).map(tt => (
              <TouchableOpacity
                key={tt.id}
                style={[styles.ttSelectBtn, splitTicketTypeId === tt.id && styles.ttSelectBtnActive]}
                onPress={() => setSplitTicketTypeId(tt.id)}>
                <Text style={[styles.ttSelectText, splitTicketTypeId === tt.id && { color: '#6200ea' }]}>
                  {tt.name} — {tt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.label}>Número de Participantes</Text>
            <TextInput
              style={styles.input}
              value={splitParticipants}
              onChangeText={setSplitParticipants}
              keyboardType="number-pad"
              placeholder="2"
              placeholderTextColor="#9e9e9e"
            />
            <Text style={styles.label}>Ingressos por Participante</Text>
            <TextInput
              style={styles.input}
              value={splitQtyPer}
              onChangeText={setSplitQtyPer}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#9e9e9e"
            />
            <TouchableOpacity
              style={[styles.buyBtn, createSplitMutation.isPending && styles.buyBtnDisabled, { marginTop: 24 }]}
              onPress={() => createSplitMutation.mutate()}
              disabled={createSplitMutation.isPending}>
              {createSplitMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buyBtnText}>Criar Racha</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  meta: { fontSize: 14, color: '#616161', marginBottom: 6 },
  actionChips: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 4 },
  chip: { backgroundColor: '#ede7f6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, color: '#6200ea', fontWeight: '600' },
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
  waitlistBtn: { backgroundColor: '#fff3e0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  waitlistBtnText: { fontSize: 11, color: '#e65100', fontWeight: '600' },
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
  splitBtn: { marginTop: 10, borderWidth: 1.5, borderColor: '#6200ea', borderRadius: 10, padding: 14, alignItems: 'center' },
  splitBtnText: { color: '#6200ea', fontWeight: '700', fontSize: 15 },
  reviewSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  avgRating: { fontSize: 20, fontWeight: '800', color: '#f9a825' },
  totalReviews: { fontSize: 12, color: '#9e9e9e' },
  reviewCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  reviewComment: { fontSize: 13, color: '#424242', lineHeight: 20, marginBottom: 4 },
  reviewDate: { fontSize: 11, color: '#9e9e9e' },
  reviewForm: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginTop: 10, elevation: 1 },
  reviewFormTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 10 },
  reviewInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginTop: 10, fontSize: 14, color: '#212121', textAlignVertical: 'top' },
  reviewSubmit: { backgroundColor: '#6200ea', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  reviewSubmitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modal: { flex: 1, backgroundColor: '#f5f5f5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#6200ea' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 20, color: '#fff' },
  modalBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 13, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },
  ttSelectBtn: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 8 },
  ttSelectBtnActive: { borderColor: '#6200ea', backgroundColor: '#ede7f6' },
  ttSelectText: { fontSize: 14, color: '#424242', fontWeight: '600' },
});
