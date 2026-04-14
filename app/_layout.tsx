import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import Purchases from 'react-native-purchases';
import { useSession } from '@/hooks/useSession';
import { ProfileProvider } from '@/context/ProfileContext';
import { configureRevenueCat } from '@/lib/revenuecat';

export default function RootLayout() {
  const { session, loading } = useSession();

  // Configure RevenueCat once on mount, then log in/out with Supabase session.
  useEffect(() => {
    configureRevenueCat();
  }, []);

  useEffect(() => {
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
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </ProfileProvider>
  );
}
