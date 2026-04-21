import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/auth';

const queryClient = new QueryClient();

export default function RootLayout() {
  const loadToken = useAuthStore(s => s.loadToken);
  useEffect(() => { loadToken(); }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerStyle: { backgroundColor: '#6200ea' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="event/[id]" options={{ title: 'Evento' }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
