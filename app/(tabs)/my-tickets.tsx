import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, Alert, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ticketsApi, Ticket } from '../../src/api/tickets';
import { resaleApi } from '../../src/api/resale';
import { useAuthStore } from '../../src/store/auth';

function QRImage({ base64, size }: { base64: string; size: number }) {
  return (
    <Image
      source={{ uri: `data:image/png;base64,${base64}` }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

function ResaleModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [price, setPrice] = useState(String(ticket.unitPrice));
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const parsed = parseFloat(price.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor maior que zero.');
      return;
    }
    setLoading(true);
    try {
      await resaleApi.create(ticket.id, parsed);
      Alert.alert('✅', 'Ingresso colocado em revenda!');
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao colocar em revenda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.resaleOverlay}>
        <View style={styles.resaleBox}>
          <Text style={styles.resaleTitle}>💰 Revender Ingresso</Text>
          <Text style={styles.resaleEvent} numberOfLines={2}>{ticket.eventTitle}</Text>
          <Text style={styles.resaleType}>{ticket.ticketTypeName}</Text>
          <Text style={styles.resaleLabel}>Preço de venda (R$)</Text>
          <TextInput
            style={styles.resaleInput}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor="#9e9e9e"
            autoFocus
          />
          <View style={styles.resaleActions}>
            <TouchableOpacity style={styles.resaleCancelBtn} onPress={onClose}>
              <Text style={styles.resaleCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resaleConfirmBtn, loading && { opacity: 0.6 }]} onPress={handleConfirm} disabled={loading}>
              <Text style={styles.resaleConfirmText}>{loading ? 'Enviando...' : 'Colocar à venda'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TicketCard({ ticket, onPress, onResale }: { ticket: Ticket; onPress: () => void; onResale: () => void }) {
  const date = new Date(ticket.eventDateTime);
  return (
    <TouchableOpacity style={[styles.card, ticket.isUsed && styles.cardUsed]} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardEvent} numberOfLines={2}>{ticket.eventTitle}</Text>
        <Text style={styles.cardType}>{ticket.ticketTypeName}</Text>
        <Text style={styles.cardDate}>📅 {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        <Text style={styles.cardVenue}>📍 {ticket.eventVenue}</Text>
        <Text style={styles.cardSerial}>#{ticket.serialNumber}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={(e) => { e.stopPropagation(); router.push(`/transfer/${ticket.id}`); }}>
            <Text style={styles.actionBtnText}>↗️ Transferir</Text>
          </TouchableOpacity>
          {!ticket.isUsed && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e8f5e9' }]} onPress={(e) => {
              e.stopPropagation();
              onResale();
            }}>
              <Text style={[styles.actionBtnText, { color: '#4caf50' }]}>💰 Revender</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        <QRImage base64={ticket.qrCodeBase64} size={80} />
        {ticket.isUsed && (
          <View style={styles.usedBadge}><Text style={styles.usedBadgeText}>USADO</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function TicketModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const date = new Date(ticket.eventDateTime);
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Ingresso</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
        </View>
        <View style={styles.modalQr}>
          <QRImage base64={ticket.qrCodeBase64} size={220} />
          {ticket.isUsed && (
            <View style={styles.usedOverlay}><Text style={styles.usedOverlayText}>UTILIZADO</Text></View>
          )}
        </View>
        <View style={styles.modalInfo}>
          <Text style={styles.modalEvent}>{ticket.eventTitle}</Text>
          <Text style={styles.modalType}>{ticket.ticketTypeName}</Text>
          {[
            { label: 'Data', value: date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) },
            { label: 'Horário', value: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
            { label: 'Local', value: ticket.eventVenue },
            { label: 'Série', value: `#${ticket.serialNumber}` },
            { label: 'Valor', value: ticket.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
          ].map(row => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalActionBtn} onPress={() => { onClose(); router.push(`/transfer/${ticket.id}`); }}>
            <Text style={styles.modalActionBtnText}>↗️ Transferir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function MyTicketsScreen() {
  const { isAuthenticated } = useAuthStore();
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [resaleTicket, setResaleTicket] = useState<Ticket | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: ticketsApi.getMyTickets,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🎟</Text>
        <Text style={styles.emptyTitle}>Nenhum ingresso</Text>
        <Text style={styles.emptyText}>Faça login para ver seus ingressos.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={t => String(t.id)}
        renderItem={({ item }) => <TicketCard ticket={item} onPress={() => setSelected(item)} onResale={() => setResaleTicket(item)} />}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🎟</Text>
            <Text style={styles.emptyTitle}>Nenhum ingresso</Text>
            <Text style={styles.emptyText}>Seus ingressos aparecem aqui após a compra.</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(tabs)/events')}>
              <Text style={styles.loginBtnText}>Explorar Eventos</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} />}
      {resaleTicket && <ResaleModal ticket={resaleTicket} onClose={() => setResaleTicket(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12, elevation: 2 },
  cardUsed: { opacity: 0.6 },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardEvent: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 4 },
  cardType: { fontSize: 13, color: '#6200ea', fontWeight: '600', marginBottom: 6 },
  cardDate: { fontSize: 12, color: '#616161', marginBottom: 2 },
  cardVenue: { fontSize: 12, color: '#616161', marginBottom: 6 },
  cardSerial: { fontSize: 11, color: '#9e9e9e', marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: '#ede7f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  actionBtnText: { fontSize: 11, color: '#6200ea', fontWeight: '600' },
  usedBadge: { position: 'absolute', bottom: -4, backgroundColor: '#e53935', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  usedBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 20 },
  loginBtn: { backgroundColor: '#6200ea', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modal: { flex: 1, backgroundColor: '#f5f5f5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#6200ea' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 20, color: '#fff' },
  modalQr: { alignItems: 'center', padding: 32, backgroundColor: '#fff', margin: 16, borderRadius: 16, elevation: 2, position: 'relative' },
  usedOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(229,57,53,0.7)', alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  usedOverlayText: { color: '#fff', fontSize: 28, fontWeight: '900', transform: [{ rotate: '-20deg' }] },
  modalInfo: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  modalEvent: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 4 },
  modalType: { fontSize: 14, color: '#6200ea', fontWeight: '600', marginBottom: 16 },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { width: 80, fontSize: 13, color: '#9e9e9e', fontWeight: '600' },
  infoValue: { flex: 1, fontSize: 13, color: '#212121' },
  modalActions: { margin: 16, gap: 10 },
  modalActionBtn: { backgroundColor: '#ede7f6', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalActionBtnText: { color: '#6200ea', fontWeight: '700', fontSize: 15 },
  resaleOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  resaleBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', elevation: 8 },
  resaleTitle: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 8 },
  resaleEvent: { fontSize: 14, color: '#424242', marginBottom: 2 },
  resaleType: { fontSize: 13, color: '#6200ea', fontWeight: '600', marginBottom: 16 },
  resaleLabel: { fontSize: 13, color: '#616161', marginBottom: 6 },
  resaleInput: { backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '700', color: '#212121', borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 20 },
  resaleActions: { flexDirection: 'row', gap: 10 },
  resaleCancelBtn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  resaleCancelText: { color: '#616161', fontWeight: '600', fontSize: 14 },
  resaleConfirmBtn: { flex: 2, backgroundColor: '#4caf50', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  resaleConfirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
