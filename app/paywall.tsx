import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { usePremium } from '@/hooks/usePremium';

const FEATURES = [
  {
    icon: '✨',
    title: 'AI Spending Coach',
    description: 'Get personalised insights on your habits every day.',
  },
  {
    icon: '📊',
    title: 'Advanced Stats',
    description: 'Monthly trends, category breakdowns, and spending forecasts.',
  },
  {
    icon: '🚫',
    title: 'No Ads',
    description: 'A clean, distraction-free experience.',
  },
  {
    icon: '🎯',
    title: 'Unlimited Goals',
    description: 'Track as many savings goals as you like.',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { subscribe, restore, loading: purchaseLoading, error } = usePremium();

  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    Purchases.getOfferings()
      .then((offerings) => {
        const monthly = offerings.current?.monthly ?? offerings.current?.availablePackages[0] ?? null;
        setPkg(monthly);
      })
      .catch(() => {})
      .finally(() => setOfferingsLoading(false));
  }, []);

  async function handleSubscribe() {
    if (!pkg) return;
    const success = await subscribe(pkg);
    if (success) router.back();
  }

  async function handleRestore() {
    setRestoring(true);
    const success = await restore();
    setRestoring(false);
    if (success) {
      router.back();
    } else {
      Alert.alert('No purchases found', 'No previous subscription was found for this account.');
    }
  }

  const priceLabel = pkg?.product.priceString ?? null;
  const busy = purchaseLoading || offeringsLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      {/* Close button */}
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={16}
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          zIndex: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#1e1e1e',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 20, lineHeight: 22 }}>×</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 56, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: 'rgba(34,197,94,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 40 }}>✨</Text>
          </View>
          <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 }}>
            Allowance Premium
          </Text>
          <Text style={{ color: '#a1a1aa', fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
            The tools you need to build{'\n'}real financial discipline.
          </Text>
        </View>

        {/* Feature list */}
        <View style={{ gap: 16, marginBottom: 40 }}>
          {FEATURES.map((f) => (
            <View
              key={f.title}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: '#111111',
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: '#1e1e1e',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 20 }}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 3 }}>
                  {f.title}
                </Text>
                <Text style={{ color: '#71717a', fontSize: 13, lineHeight: 18 }}>
                  {f.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing — shows RC price or spinner while loading */}
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: '#22c55e',
            padding: 20,
            alignItems: 'center',
            marginBottom: 24,
            backgroundColor: 'rgba(34,197,94,0.05)',
          }}
        >
          <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Monthly plan
          </Text>
          {offeringsLoading ? (
            <ActivityIndicator color="#22c55e" style={{ marginVertical: 12 }} />
          ) : priceLabel ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: '#ffffff', fontSize: 42, fontWeight: '800', letterSpacing: -1 }}>
                  {priceLabel}
                </Text>
                <Text style={{ color: '#a1a1aa', fontSize: 16, marginBottom: 8 }}>/month</Text>
              </View>
              <Text style={{ color: '#52525b', fontSize: 13, marginTop: 4 }}>
                Cancel anytime. No commitment.
              </Text>
            </>
          ) : (
            <Text style={{ color: '#f87171', fontSize: 14 }}>
              Could not load pricing. Check your connection.
            </Text>
          )}
        </View>

        {error !== '' && (
          <Text style={{ color: '#f87171', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </Text>
        )}

        {/* Subscribe CTA */}
        <TouchableOpacity
          style={{
            backgroundColor: '#22c55e',
            borderRadius: 14,
            paddingVertical: 17,
            alignItems: 'center',
            opacity: busy || !pkg ? 0.5 : 1,
          }}
          onPress={handleSubscribe}
          disabled={busy || !pkg}
        >
          {purchaseLoading ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={{ color: '#0a0a0a', fontWeight: '700', fontSize: 17 }}>
              {priceLabel ? `Subscribe for ${priceLabel}/month` : 'Subscribe'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={restoring}
          style={{ alignItems: 'center', marginTop: 16 }}
        >
          {restoring ? (
            <ActivityIndicator color="#52525b" size="small" />
          ) : (
            <Text style={{ color: '#52525b', fontSize: 13 }}>Restore purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: '#3f3f46', fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 }}>
          Subscription renews monthly via Google Play. Cancel any time in Play Store settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
