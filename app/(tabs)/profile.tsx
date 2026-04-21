import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';

interface MenuItemProps { icon: string; label: string; onPress: () => void; danger?: boolean; }

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.avatarLarge}>👤</Text>
        <Text style={styles.guestTitle}>Bem-vindo ao Tickly</Text>
        <Text style={styles.guestText}>Entre na sua conta para acessar ingressos, histórico e muito mais.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerBtnText}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = (user?.name ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {isOrganizer && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role === 'Admin' ? '⚙️ Admin' : '🎪 Organizador'}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Minha Conta</Text>
        <MenuItem icon="🎟" label="Meus Ingressos" onPress={() => router.push('/(tabs)/my-tickets')} />
        <MenuItem icon="🎪" label="Explorar Eventos" onPress={() => router.push('/(tabs)/events')} />
      </View>

      {isOrganizer && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Organizador</Text>
          <MenuItem icon="📷" label="Scanner de Check-in" onPress={() => router.push('/(tabs)/scan')} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>App</Text>
        <MenuItem icon="ℹ️" label="Sobre o Tickly" onPress={() => Alert.alert('Tickly', 'Plataforma de ingressos v1.0.0\nDesenvolvida com Expo + React Native')} />
        <MenuItem icon="🚪" label="Sair" onPress={handleLogout} danger />
      </View>

      <Text style={styles.version}>Tickly v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: { backgroundColor: '#6200ea', paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: '800' },
  avatarLarge: { fontSize: 80, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  roleBadge: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  roleBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  section: { backgroundColor: '#fff', marginTop: 16, marginHorizontal: 0 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9e9e9e', textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuIcon: { fontSize: 22, width: 36 },
  menuLabel: { flex: 1, fontSize: 15, color: '#212121' },
  menuLabelDanger: { color: '#e53935' },
  menuArrow: { fontSize: 20, color: '#bdbdbd' },
  guestTitle: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 8 },
  guestText: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 28 },
  loginBtn: { backgroundColor: '#6200ea', borderRadius: 10, paddingHorizontal: 40, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  registerBtn: { borderWidth: 1.5, borderColor: '#6200ea', borderRadius: 10, paddingHorizontal: 40, paddingVertical: 14, width: '100%', alignItems: 'center' },
  registerBtnText: { color: '#6200ea', fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: '#bdbdbd', fontSize: 12, padding: 24 },
});
