import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { useProfileContext } from '@/context/ProfileContext';
import { usePremium } from '@/hooks/usePremium';
import { useDailyReminder } from '@/hooks/useDailyReminder';

type RecurringExpense = {
  id: string;
  name: string;
  amount: number;
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SettingsScreen() {
  const { profile, loading: profileLoading, refetch } = useProfileContext();
  const { isPremium } = usePremium();
  const { enabled: reminderEnabled, toggle: toggleReminder } = useDailyReminder();
  const [exporting, setExporting] = useState(false);

  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeValue, setIncomeValue] = useState('');
  const [savingIncome, setSavingIncome] = useState(false);
  const [incomeError, setIncomeError] = useState('');

  const [editingSavings, setEditingSavings] = useState(false);
  const [savingsValue, setSavingsValue] = useState('');
  const [savingSavings, setSavingSavings] = useState(false);
  const [savingsError, setSavingsError] = useState('');

  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const [addExpenseError, setAddExpenseError] = useState('');

  const fetchExpenses = useCallback(async () => {
    setExpensesLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setExpensesLoading(false);
      return;
    }
    const { data } = await supabase
      .from('recurring_expenses')
      .select('id, name, amount')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setExpenses(data ?? []);
    setExpensesLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function saveIncome() {
    const val = Number(incomeValue);
    if (isNaN(val) || val < 0) {
      setIncomeError('Enter a valid income amount.');
      return;
    }
    setIncomeError('');
    setSavingIncome(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingIncome(false); return; }
    const { error } = await supabase
      .from('profiles')
      .update({ monthly_income: val })
      .eq('id', user.id);
    setSavingIncome(false);
    if (error) {
      setIncomeError(error.message);
      return;
    }
    setEditingIncome(false);
    refetch();
  }

  async function saveSavings() {
    const val = Number(savingsValue);
    if (isNaN(val) || val < 0 || val > 100) {
      setSavingsError('Enter a percentage between 0 and 100.');
      return;
    }
    setSavingsError('');
    setSavingSavings(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingSavings(false); return; }
    const { error } = await supabase
      .from('profiles')
      .update({ savings_goal_percent: val })
      .eq('id', user.id);
    setSavingSavings(false);
    if (error) {
      setSavingsError(error.message);
      return;
    }
    setEditingSavings(false);
    refetch();
  }

  async function deleteExpense(id: string) {
    await supabase.from('recurring_expenses').delete().eq('id', id);
    fetchExpenses();
  }

  async function addExpense() {
    const name = newExpenseName.trim();
    const amt = Number(newExpenseAmount);
    if (!name || isNaN(amt) || amt <= 0) {
      setAddExpenseError('Enter a valid name and amount.');
      return;
    }
    setAddExpenseError('');
    setAddingExpense(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddingExpense(false); return; }
    const { error } = await supabase.from('recurring_expenses').insert({
      user_id: user.id,
      name,
      amount: amt,
    });
    setAddingExpense(false);
    if (error) {
      setAddExpenseError(error.message);
      return;
    }
    setNewExpenseName('');
    setNewExpenseAmount('');
    fetchExpenses();
  }

  async function handleExport() {
    setExporting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');

      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_date, amount, category, note')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw new Error(error.message);

      const rows = data ?? [];
      const header = 'Date,Amount,Category,Note\n';
      const body = rows
        .map((r) => {
          const note = r.note ? `"${String(r.note).replace(/"/g, '""')}"` : '';
          return `${r.transaction_date},${r.amount},${r.category},${note}`;
        })
        .join('\n');

      const csv = header + body;
      const path = `${FileSystem.cacheDirectory}transactions.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing not available on this device.');
        return;
      }
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Transactions' });
    } catch (e: unknown) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  if (profileLoading || expensesLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  const inputStyle = {
    backgroundColor: '#18181b',
    color: '#ffffff' as const,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    flex: 1,
    marginRight: 8,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 60 }}>
        <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '700', marginBottom: 28 }}>
          Settings
        </Text>

        {/* Income */}
        <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Monthly income
        </Text>
        <View
          style={{
            backgroundColor: '#18181b',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#27272a',
            marginBottom: 24,
          }}
        >
          {editingIncome ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={inputStyle}
                  value={incomeValue}
                  onChangeText={setIncomeValue}
                  keyboardType="numeric"
                  autoFocus
                  placeholderTextColor="#52525b"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#22c55e',
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    opacity: savingIncome ? 0.7 : 1,
                  }}
                  onPress={saveIncome}
                  disabled={savingIncome}
                >
                  {savingIncome ? (
                    <ActivityIndicator color="#0a0a0a" size="small" />
                  ) : (
                    <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 14 }}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
              {incomeError !== '' && (
                <Text style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{incomeError}</Text>
              )}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
                ${profile ? fmt(profile.monthly_income) : '—'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIncomeValue(profile ? String(profile.monthly_income) : '');
                  setIncomeError('');
                  setEditingIncome(true);
                }}
              >
                <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '500' }}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Savings Goal */}
        <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Savings goal
        </Text>
        <View
          style={{
            backgroundColor: '#18181b',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#27272a',
            marginBottom: 24,
          }}
        >
          {editingSavings ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={inputStyle}
                  value={savingsValue}
                  onChangeText={setSavingsValue}
                  keyboardType="numeric"
                  autoFocus
                  placeholderTextColor="#52525b"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#22c55e',
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    opacity: savingSavings ? 0.7 : 1,
                  }}
                  onPress={saveSavings}
                  disabled={savingSavings}
                >
                  {savingSavings ? (
                    <ActivityIndicator color="#0a0a0a" size="small" />
                  ) : (
                    <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 14 }}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
              {savingsError !== '' && (
                <Text style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{savingsError}</Text>
              )}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
                {profile ? `${profile.savings_goal_percent}%` : '—'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSavingsValue(profile ? String(profile.savings_goal_percent) : '');
                  setSavingsError('');
                  setEditingSavings(true);
                }}
              >
                <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '500' }}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recurring Expenses */}
        <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Recurring expenses
        </Text>
        {expenses.length === 0 ? (
          <View
            style={{
              backgroundColor: '#18181b',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#27272a',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#a1a1aa', fontSize: 15 }}>No recurring expenses</Text>
          </View>
        ) : (
          <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a', marginBottom: 16 }}>
            {expenses.map((e, idx) => (
              <View
                key={e.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#18181b',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: '#27272a',
                }}
              >
                <Text style={{ flex: 1, color: '#ffffff', fontSize: 15 }}>{e.name}</Text>
                <Text style={{ color: '#a1a1aa', fontSize: 15, marginRight: 12 }}>${fmt(e.amount)}</Text>
                <TouchableOpacity onPress={() => deleteExpense(e.id)} hitSlop={8}>
                  <Text style={{ color: '#f87171', fontSize: 18, fontWeight: '700' }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View
          style={{
            backgroundColor: '#18181b',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#27272a',
            marginBottom: 40,
          }}
        >
          <Text style={{ color: '#a1a1aa', fontSize: 13, marginBottom: 8 }}>Name</Text>
          <TextInput
            style={{
              backgroundColor: '#0a0a0a',
              color: '#ffffff',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              borderWidth: 1,
              borderColor: '#27272a',
              marginBottom: 10,
            }}
            placeholder="e.g. Rent"
            placeholderTextColor="#52525b"
            value={newExpenseName}
            onChangeText={setNewExpenseName}
          />
          <Text style={{ color: '#a1a1aa', fontSize: 13, marginBottom: 8 }}>Amount ($)</Text>
          <TextInput
            style={{
              backgroundColor: '#0a0a0a',
              color: '#ffffff',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              borderWidth: 1,
              borderColor: '#27272a',
              marginBottom: 12,
            }}
            placeholder="e.g. 1200"
            placeholderTextColor="#52525b"
            value={newExpenseAmount}
            onChangeText={setNewExpenseAmount}
            keyboardType="numeric"
          />
          {addExpenseError !== '' && (
            <Text style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{addExpenseError}</Text>
          )}
          <TouchableOpacity
            style={{
              backgroundColor: '#22c55e',
              borderRadius: 10,
              paddingVertical: 13,
              alignItems: 'center',
              opacity: addingExpense ? 0.7 : 1,
            }}
            onPress={addExpense}
            disabled={addingExpense}
          >
            {addingExpense ? (
              <ActivityIndicator color="#0a0a0a" size="small" />
            ) : (
              <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 15 }}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Notifications
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#18181b',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#27272a',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 40,
          }}
          onPress={toggleReminder}
        >
          <Text style={{ fontSize: 20, marginRight: 10 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>Daily reminder</Text>
            <Text style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>
              {reminderEnabled ? 'Every day at 8 PM' : 'Tap to enable a daily budget check-in'}
            </Text>
          </View>
          <View
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              backgroundColor: reminderEnabled ? '#22c55e' : '#27272a',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#ffffff',
                alignSelf: reminderEnabled ? 'flex-end' : 'flex-start',
              }}
            />
          </View>
        </TouchableOpacity>

        {/* Export */}
        <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Data
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#18181b',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#27272a',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 40,
            opacity: exporting ? 0.6 : 1,
          }}
          onPress={handleExport}
          disabled={exporting}
        >
          <Text style={{ fontSize: 20, marginRight: 10 }}>📤</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>Export Transactions</Text>
            <Text style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>Download all transactions as CSV</Text>
          </View>
          {exporting
            ? <ActivityIndicator color="#22c55e" size="small" />
            : <Text style={{ color: '#52525b', fontSize: 16 }}>›</Text>}
        </TouchableOpacity>

        {/* Premium */}
        <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Subscription
        </Text>
        {isPremium ? (
          <View
            style={{
              backgroundColor: 'rgba(34,197,94,0.08)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(34,197,94,0.3)',
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 10 }}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#22c55e', fontSize: 15, fontWeight: '700' }}>Premium active</Text>
              <Text style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>
                All features unlocked. Thank you!
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: '#111111',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#27272a',
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 40,
            }}
            onPress={() => router.push('/paywall')}
          >
            <Text style={{ fontSize: 20, marginRight: 10 }}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>Upgrade to Premium</Text>
              <Text style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>
                AI Coach, no ads, unlimited goals
              </Text>
            </View>
            <Text style={{ color: '#22c55e', fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={{
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#f87171',
          }}
          onPress={handleSignOut}
        >
          <Text style={{ color: '#f87171', fontWeight: '600', fontSize: 16 }}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
