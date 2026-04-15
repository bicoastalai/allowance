import '../global.css';
import { useEffect, Component, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import Purchases from 'react-native-purchases';
import { useSession } from '@/hooks/useSession';
import { ProfileProvider } from '@/context/ProfileContext';
import { configureRevenueCat } from '@/lib/revenuecat';

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#f87171', fontSize: 16, textAlign: 'center', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ color: '#52525b', fontSize: 13, textAlign: 'center' }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const { session, loading } = useSession();

  // Configure RevenueCat once on mount, then log in/out with Supabase session.
  useEffect(() => {
    configureRevenueCat();
  }, []);

  useEffect(() => {
    const rcConfigured = !!(process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? '');
    if (!rcConfigured) return;
    if (session?.user.id) {
      Purchases.logIn(session.user.id).catch(() => {});
    } else {
      Purchases.logOut().catch(() => {});
    }
  }, [session?.user.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  return (
    <RootErrorBoundary>
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </ProfileProvider>
    </RootErrorBoundary>
  );
}
