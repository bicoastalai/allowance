import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useProfileContext } from '@/context/ProfileContext';
import { useStreak } from '@/hooks/useStreak';
import { useAICoach } from '@/hooks/useAICoach';
import { usePremium } from '@/hooks/usePremium';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { useDailyBudget, useTransactions, AddTransactionModal } from '@/features/transactions';

const BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? TestIds.BANNER;

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfileContext();
  const { dailyAllowance, currentBalance, isOverBudget, isLoading } = useDailyBudget(profile);
  const { currentStreak, longestStreak } = useStreak(dailyAllowance);
  const { isPremium } = usePremium();
  const { showIfReady: showInterstitial } = useInterstitialAd();

  const [modalVisible, setModalVisible] = useState(false);

  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { data: monthTransactions = [] } = useTransactions({ fromDate: firstOfMonth });

  const { insight, loading: coachLoading, error: coachError, refresh: refreshCoach } = useAICoach(
    monthTransactions,
    dailyAllowance,
    currentBalance,
  );

  function handleSuccess() {
    if (!isPremium) showInterstitial();
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  const balanceColor = currentBalance >= 0 ? '#22c55e' : '#f87171';
  const showPersonalBest = currentStreak > 0 && currentStreak === longestStreak;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#a1a1aa', fontSize: 16, marginBottom: 12 }}>Current balance</Text>
          <Text style={{ color: balanceColor, fontSize: 64, fontWeight: '700', letterSpacing: -2 }}>
            ${fmt(currentBalance)}
          </Text>
          <Text style={{ color: '#a1a1aa', fontSize: 16, marginTop: 12 }}>
            Daily allowance: ${fmt(dailyAllowance)}
          </Text>

          {currentStreak > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
              <Text style={{ color: '#ffffff', fontSize: 13 }}>
                🔥 {currentStreak} day streak
              </Text>
              {showPersonalBest && (
                <Text style={{ color: '#22c55e', fontSize: 13 }}>Personal best!</Text>
              )}
            </View>
          )}

          {isOverBudget && (
            <Text style={{ color: '#f87171', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
              Your expenses exceed your income. Update your settings.
            </Text>
          )}

          {isPremium ? (
            <View
              style={{
                backgroundColor: '#111111',
                borderRadius: 12,
                padding: 16,
                marginTop: 24,
                width: '100%',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                <Text style={{ fontSize: 16 }}>✨</Text>
                <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>AI Coach</Text>
              </View>
              {coachLoading ? (
                <ActivityIndicator color="#22c55e" size="small" />
              ) : coachError ? (
                <Text style={{ color: '#f87171', fontSize: 14 }}>{coachError}</Text>
              ) : insight ? (
                <Text style={{ color: '#d4d4d8', fontSize: 14, lineHeight: 20 }}>{insight}</Text>
              ) : (
                <Text style={{ color: '#52525b', fontSize: 14 }}>Tap Refresh to get an insight.</Text>
              )}
              <TouchableOpacity onPress={refreshCoach} style={{ marginTop: 12 }}>
                <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '500' }}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push('/paywall')} style={{ marginTop: 20 }}>
              <Text style={{ color: '#22c55e', fontSize: 13 }}>✨ Upgrade to unlock AI Coach</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={{
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#22c55e',
            marginBottom: 12,
          }}
          onPress={() => router.push('/goals')}
        >
          <Text style={{ color: '#22c55e', fontWeight: '600', fontSize: 16 }}>Goals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#22c55e',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 32,
          }}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Log Expense</Text>
        </TouchableOpacity>
      </View>

      {!isPremium && (
        <View style={{ alignItems: 'center', paddingBottom: 8 }}>
          <BannerAd unitId={BANNER_ID} size={BannerAdSize.BANNER} />
        </View>
      )}

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleSuccess}
      />
    </SafeAreaView>
  );
}
