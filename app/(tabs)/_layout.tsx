import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/auth';
import { notificationsApi } from '../../src/api/notifications';

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = unread?.count ?? 0;

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#6200ea',
      tabBarInactiveTintColor: '#9e9e9e',
      headerStyle: { backgroundColor: '#6200ea' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Tabs.Screen
        name="events"
        options={{ title: 'Eventos', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="my-tickets"
        options={{
          title: 'Meus Ingressos',
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket" size={size} color={color} />,
          href: isAuthenticated ? '/(tabs)/my-tickets' : null,
        }}
      />
      <Tabs.Screen
        name="loyalty"
        options={{
          title: 'Fidelidade',
          tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />,
          href: isAuthenticated ? '/(tabs)/loyalty' : null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="notifications" size={size} color={color} />
              <Badge count={unreadCount} />
            </View>
          ),
          href: isAuthenticated ? '/(tabs)/notifications' : null,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} />,
          href: isOrganizer ? '/(tabs)/scan' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#e53935', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
