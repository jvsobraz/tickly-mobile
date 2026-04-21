import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const MENU = [
  { icon: '🎪', label: 'Meus Eventos', desc: 'Gerencie seus eventos', route: '/admin/my-events' },
  { icon: '➕', label: 'Criar Evento', desc: 'Novo evento', route: '/admin/create-event' },
  { icon: '💰', label: 'Dashboard Financeiro', desc: 'Receitas e repasses', route: '/admin/financial' },
  { icon: '🎟', label: 'Cupons', desc: 'Gerenciar cupons de desconto', route: '/admin/coupons' },
  { icon: '⚡', label: 'Flash Sales', desc: 'Promoções por tempo limitado', route: '/admin/flash-sales' },
  { icon: '🔗', label: 'Links de Pagamento', desc: 'Links para venda direta', route: '/admin/payment-links' },
  { icon: '📊', label: 'Analytics', desc: 'Relatórios dos seus eventos', route: '/admin/analytics' },
  { icon: '📷', label: 'Scanner Offline', desc: 'Check-in sem internet', route: '/(tabs)/scan' },
];

export default function AdminIndexScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Painel do Organizador</Text>
        <Text style={styles.headerSub}>Gerencie seus eventos e vendas</Text>
      </View>
      <View style={styles.grid}>
        {MENU.map(item => (
          <TouchableOpacity key={item.route} style={styles.card} onPress={() => router.push(item.route as any)}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6200ea', padding: 24 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, alignItems: 'center' },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#212121', textAlign: 'center', marginBottom: 4 },
  cardDesc: { fontSize: 11, color: '#9e9e9e', textAlign: 'center' },
});
