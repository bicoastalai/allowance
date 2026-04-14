import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? TestIds.BANNER;
import { supabase } from '@/lib/supabase';
import { useProfileContext } from '@/context/ProfileContext';
import { useDailyBudget } from '@/hooks/useDailyBudget';
import { useStreak } from '@/hooks/useStreak';
import { useAICoach } from '@/hooks/useAICoach';
import { usePremium } from '@/hooks/usePremium';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { DEFAULT_CATEGORIES, type Category } from '@/constants/categories';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Transaction = {
  amount: number;
  category: string;
  transaction_date: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfileContext();
  const { dailyAllowance, currentBalance, isOverBudget, loading, refetch } = useDailyBudget(profile);
  const { currentStreak, longestStreak } = useStreak(dailyAllowance);
  const { isPremium } = usePremium();
  const { showIfReady: showInterstitial } = useInterstitialAd();

  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);

  const fetchMonthTransactions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const { data } = await supabase
      .from('transactions')
      .select('amount, category, transaction_date')
      .eq('user_id', user.id)
      .gte('transaction_date', firstOfMonth);
    setMonthTransactions(
      (data ?? []).map((t) => ({
        amount: Number(t.amount),
        category: t.category as string,
        transaction_date: t.transaction_date as string,
      })),
    );
  }, []);

  useEffect(() => {
    fetchMonthTransactions();
  }, [fetchMonthTransactions]);

  const { insight, loading: coachLoading, error: coachError, refresh: refreshCoach } = useAICoach(
    monthTransactions,
    dailyAllowance,
    currentBalance,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const amt = Number(amount);
    if (!amount.trim() || isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setError('');
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated.');
      setSaving(false);
      return;
    }

    const today = new Date();
    const transaction_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount: amt,
      category,
      note: note.trim() || null,
      transaction_date,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setAmount('');
    setNote('');
    setCategory('Other');
    setModalVisible(false);
    refetch();
    fetchMonthTransactions();
    if (!isPremium) showInterstitial();
  }

  function openModal() {
    setAmount('');
    setNote('');
    setCategory('Other');
    setError('');
    setModalVisible(true);
  }

  if (loading) {
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

          {/* Streak row */}
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

          {/* AI Coach */}
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

        {/* Goals button */}
        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
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
          onPress={openModal}
        >
          <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Log Expense</Text>
        </TouchableOpacity>
      </View>

      {/* AdMob banner */}
      {!isPremium && (
        <View style={{ alignItems: 'center', paddingBottom: 8 }}>
          <BannerAd unitId={BANNER_ID} size={BannerAdSize.BANNER} />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={{
              backgroundColor: '#111111',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 48,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 24 }}>
              Log Expense
            </Text>

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Amount ($)</Text>
            <TextInput
              style={{
                backgroundColor: '#18181b',
                color: '#ffffff',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#27272a',
                marginBottom: 20,
              }}
              placeholder="0.00"
              placeholderTextColor="#52525b"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 10 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {DEFAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: category === cat ? '#22c55e' : '#27272a',
                    backgroundColor: category === cat ? 'rgba(34,197,94,0.15)' : '#18181b',
                  }}
                >
                  <Text style={{ color: category === cat ? '#22c55e' : '#a1a1aa', fontSize: 14 }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Note (optional)</Text>
            <TextInput
              style={{
                backgroundColor: '#18181b',
                color: '#ffffff',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#27272a',
                marginBottom: 20,
              }}
              placeholder="What was this for?"
              placeholderTextColor="#52525b"
              value={note}
              onChangeText={setNote}
            />

            {error !== '' && (
              <Text style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{error}</Text>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: '#22c55e',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: saving ? 0.7 : 1,
              }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
