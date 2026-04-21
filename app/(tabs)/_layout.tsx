import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';

export default function TabsLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

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
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
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
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} />,
          href: isOrganizer ? '/(tabs)/scan' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
