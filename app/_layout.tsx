import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../src/notifications';

const queryClient = new QueryClient();

function handleDeepLink(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || parsed.host + parsed.pathname;

    if (path.includes('/ticket-transfers/accept/') || url.includes('tickly://transfer/accept/')) {
      const token = path.split('/').pop();
      if (token) router.push(`/transfer/accept/${token}` as any);
    } else if (path.includes('/split/') || url.includes('tickly://split/')) {
      const token = path.split('/').pop();
      if (token) router.push(`/split/${token}` as any);
    }
  } catch {
    // URL inválida — ignora
  }
}

export default function RootLayout() {
  const loadToken = useAuthStore(s => s.loadToken);

  useEffect(() => {
    loadToken();

    // Deep links
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // Push notifications — solicita permissão e registra token no backend
    registerForPushNotificationsAsync();

    // Ao tocar em uma notificação, navega para a tela correta
    const cleanupNotifications = setupNotificationListeners(
      undefined,
      (response) => {
        const screen = response.notification.request.content.data?.screen as string | undefined;
        if (screen) router.push(`/${screen}` as any);
      }
    );

    return () => {
      linkSub.remove();
      cleanupNotifications();
    };
  }, []);

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
