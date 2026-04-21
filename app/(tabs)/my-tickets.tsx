import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, Pressable } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { ticketsApi, Ticket } from '../../src/api/tickets';
import { useAuthStore } from '../../src/store/auth';

function TicketCard({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) {
  const date = new Date(ticket.eventDateTime);
  return (
    <TouchableOpacity style={[styles.card, ticket.isUsed && styles.cardUsed]} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardEvent} numberOfLines={2}>{ticket.eventTitle}</Text>
        <Text style={styles.cardType}>{ticket.ticketTypeName}</Text>
        <Text style={styles.cardDate}>
          📅 {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
        <Text style={styles.cardVenue}>📍 {ticket.eventVenue}</Text>
        <Text style={styles.cardSerial}>#{ticket.serialNumber}</Text>
      </View>
      <View style={styles.cardRight}>
        <QRCode value={ticket.qrCodeHash} size={80} />
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
          <QRCode value={ticket.qrCodeHash} size={220} />
          {ticket.isUsed && (
            <View style={styles.usedOverlay}><Text style={styles.usedOverlayText}>UTILIZADO</Text></View>
          )}
        </View>
        <View style={styles.modalInfo}>
          <Text style={styles.modalEvent}>{ticket.eventTitle}</Text>
          <Text style={styles.modalType}>{ticket.ticketTypeName}</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Data</Text><Text style={styles.infoValue}>{date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Horário</Text><Text style={styles.infoValue}>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Local</Text><Text style={styles.infoValue}>{ticket.eventVenue}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Titular</Text><Text style={styles.infoValue}>{ticket.holderName}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Série</Text><Text style={styles.infoValue}>#{ticket.serialNumber}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Valor</Text><Text style={styles.infoValue}>{ticket.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></View>
        </View>
      </View>
    </Modal>
  );
}

export default function MyTicketsScreen() {
  const { isAuthenticated } = useAuthStore();
  const [selected, setSelected] = useState<Ticket | null>(null);

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
        renderItem={({ item }) => <TicketCard ticket={item} onPress={() => setSelected(item)} />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4 },
  cardUsed: { opacity: 0.6 },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardEvent: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 4 },
  cardType: { fontSize: 13, color: '#6200ea', fontWeight: '600', marginBottom: 6 },
  cardDate: { fontSize: 12, color: '#616161', marginBottom: 2 },
  cardVenue: { fontSize: 12, color: '#616161', marginBottom: 6 },
  cardSerial: { fontSize: 11, color: '#9e9e9e' },
  usedBadge: { position: 'absolute', bottom: -4, backgroundColor: '#e53935', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  usedBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 20 },
  loginBtn: { backgroundColor: '#6200ea', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal
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
});
