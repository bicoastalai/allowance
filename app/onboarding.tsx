import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

type Expense = {
  id: string;
  name: string;
  amount: string;
};

const INPUT_STYLE = {
  backgroundColor: '#18181b',
  color: '#ffffff',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: '#27272a',
} as const;

const BUTTON_STYLE = {
  backgroundColor: '#22c55e',
  borderRadius: 12,
  paddingVertical: 16,
  alignItems: 'center' as const,
  marginTop: 24,
};

const LABEL_STYLE = {
  color: '#a1a1aa',
  fontSize: 14,
  marginBottom: 8,
} as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [income, setIncome] = useState('');

  // Step 2
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Step 3
  const [savingsPercent, setSavingsPercent] = useState('');

  function addExpense() {
    const name = expenseName.trim();
    const amount = expenseAmount.trim();
    if (!name || !amount || isNaN(Number(amount))) return;
    setExpenses((prev) => [
      ...prev,
      { id: Date.now().toString(), name, amount },
    ]);
    setExpenseName('');
    setExpenseAmount('');
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleFinish() {
    const pct = Number(savingsPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError('Enter a percentage between 0 and 100.');
      return;
    }

    setError('');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('No authenticated user found.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      monthly_income: Number(income),
      savings_goal_percent: pct,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (expenses.length > 0) {
      const rows = expenses.map((e) => ({
        user_id: user.id,
        name: e.name,
        amount: Number(e.amount),
      }));

      const { error: expenseError } = await supabase
        .from('recurring_expenses')
        .insert(rows);

      if (expenseError) {
        setError(expenseError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace('/(tabs)/index');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step indicators */}
        <View style={{ flexDirection: 'row', marginBottom: 40, gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: i <= step ? '#22c55e' : '#27272a',
              }}
            />
          ))}
        </View>

        {/* ── Step 1: Income ── */}
        {step === 0 && (
          <View>
            <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '700', marginBottom: 32 }}>
              What's your monthly income?
            </Text>
            <Text style={LABEL_STYLE}>Monthly income ($)</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="e.g. 5000"
              placeholderTextColor="#52525b"
              value={income}
              onChangeText={setIncome}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={{ ...BUTTON_STYLE, opacity: !income.trim() ? 0.5 : 1 }}
              onPress={() => {
                if (!income.trim() || isNaN(Number(income))) return;
                setStep(1);
              }}
              disabled={!income.trim()}
            >
              <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Recurring Expenses ── */}
        {step === 1 && (
          <View>
            <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '700', marginBottom: 32 }}>
              Add your recurring expenses
            </Text>

            <Text style={LABEL_STYLE}>Expense name</Text>
            <TextInput
              style={{ ...INPUT_STYLE, marginBottom: 12 }}
              placeholder="e.g. Rent"
              placeholderTextColor="#52525b"
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <Text style={LABEL_STYLE}>Amount ($)</Text>
            <TextInput
              style={{ ...INPUT_STYLE, marginBottom: 16 }}
              placeholder="e.g. 1200"
              placeholderTextColor="#52525b"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#22c55e',
              }}
              onPress={addExpense}
            >
              <Text style={{ color: '#22c55e', fontWeight: '600', fontSize: 16 }}>
                + Add Expense
              </Text>
            </TouchableOpacity>

            {expenses.length > 0 && (
              <View style={{ marginTop: 24, gap: 10 }}>
                {expenses.map((e) => (
                  <View
                    key={e.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#18181b',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderWidth: 1,
                      borderColor: '#27272a',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '500' }}>
                        {e.name}
                      </Text>
                      <Text style={{ color: '#a1a1aa', fontSize: 13, marginTop: 2 }}>
                        ${Number(e.amount).toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeExpense(e.id)} hitSlop={8}>
                      <Text style={{ color: '#f87171', fontSize: 18, fontWeight: '700' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={BUTTON_STYLE}
              onPress={() => setStep(2)}
            >
              <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Savings Goal ── */}
        {step === 2 && (
          <View>
            <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '700', marginBottom: 8 }}>
              How much do you want to save?
            </Text>
            <Text style={{ color: '#a1a1aa', fontSize: 16, marginBottom: 32 }}>
              Enter a percentage of your income
            </Text>

            <Text style={LABEL_STYLE}>Savings percentage (%)</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="e.g. 20"
              placeholderTextColor="#52525b"
              value={savingsPercent}
              onChangeText={setSavingsPercent}
              keyboardType="numeric"
            />

            {error !== '' && (
              <Text style={{ color: '#f87171', fontSize: 14, marginTop: 12 }}>{error}</Text>
            )}

            <TouchableOpacity
              style={{ ...BUTTON_STYLE, opacity: loading ? 0.7 : 1 }}
              onPress={handleFinish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Finish</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
