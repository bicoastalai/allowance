import { useEffect, useState, useCallback } from 'react';
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
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  daily_contribution: number;
  created_at: string;
  saved: number;
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const INPUT_STYLE = {
  backgroundColor: '#18181b',
  color: '#ffffff' as const,
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: '#27272a',
  marginBottom: 20,
};

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // New goal modal
  const [newModalVisible, setNewModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [dailyContribution, setDailyContribution] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Deposit modal
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState('');

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: goalsData } = await supabase
      .from('savings_goals')
      .select('id, name, target_amount, daily_contribution, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const { data: contribData } = await supabase
      .from('goal_contributions')
      .select('goal_id, amount')
      .eq('user_id', user.id);

    const savedByGoal: Record<string, number> = {};
    for (const c of contribData ?? []) {
      savedByGoal[c.goal_id] = (savedByGoal[c.goal_id] ?? 0) + Number(c.amount);
    }

    const merged: Goal[] = (goalsData ?? []).map((g) => ({
      ...g,
      saved: savedByGoal[g.id] ?? 0,
    }));

    setGoals(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  function openNewModal() {
    setName('');
    setTargetAmount('');
    setDailyContribution('');
    setFormError('');
    setNewModalVisible(true);
  }

  async function handleSave() {
    const target = Number(targetAmount);
    const daily = Number(dailyContribution);
    if (!name.trim()) { setFormError('Enter a goal name.'); return; }
    if (!targetAmount.trim() || isNaN(target) || target <= 0) { setFormError('Enter a valid target amount.'); return; }
    if (!dailyContribution.trim() || isNaN(daily) || daily <= 0) { setFormError('Enter a valid daily contribution.'); return; }

    setFormError('');
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from('savings_goals').insert({
      user_id: user.id,
      name: name.trim(),
      target_amount: target,
      daily_contribution: daily,
    });

    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setNewModalVisible(false);
    fetchGoals();
  }

  function openDepositModal(goal: Goal) {
    setDepositGoal(goal);
    setDepositAmount('');
    setDepositError('');
    setDepositModalVisible(true);
  }

  async function handleDeposit() {
    const amt = Number(depositAmount);
    if (!depositAmount.trim() || isNaN(amt) || amt <= 0) {
      setDepositError('Enter a valid amount.');
      return;
    }
    setDepositError('');
    setDepositing(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !depositGoal) { setDepositing(false); return; }

    const { error } = await supabase.from('goal_contributions').insert({
      user_id: user.id,
      goal_id: depositGoal.id,
      amount: amt,
    });

    setDepositing(false);
    if (error) { setDepositError(error.message); return; }
    setDepositModalVisible(false);
    fetchGoals();
  }

  async function handleDelete(goalId: string) {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('savings_goals').delete().eq('id', goalId);
          fetchGoals();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ color: '#22c55e', fontSize: 16 }}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '700', flex: 1 }}>
          Savings Goals
        </Text>
        <TouchableOpacity
          onPress={openNewModal}
          style={{
            backgroundColor: '#22c55e',
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 14 }}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#22c55e" />
        </View>
      ) : goals.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#a1a1aa', fontSize: 16 }}>No goals yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}>
          {goals.map((goal) => {
            const pct = goal.target_amount > 0 ? (goal.saved / goal.target_amount) * 100 : 0;
            const remaining = Math.max(0, goal.target_amount - goal.saved);
            const done = goal.saved >= goal.target_amount;

            return (
              <View
                key={goal.id}
                style={{
                  backgroundColor: '#111111',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: done ? 'rgba(34,197,94,0.4)' : '#1e1e1e',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                        {goal.name}
                      </Text>
                      {done && <Text style={{ fontSize: 14 }}>🎉</Text>}
                    </View>
                    <Text style={{ color: '#a1a1aa', fontSize: 13, marginTop: 3 }}>
                      ${fmt(goal.saved)} saved · ${fmt(remaining)} to go
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(goal.id)}
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.12)',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginLeft: 12,
                    }}
                  >
                    <Text style={{ color: '#f87171', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress bar */}
                <View style={{ height: 8, backgroundColor: '#27272a', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: done ? '#22c55e' : '#22c55e',
                      borderRadius: 4,
                      width: `${Math.min(100, pct)}%`,
                      opacity: done ? 1 : 0.85,
                    }}
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#52525b', fontSize: 12 }}>
                    {pct.toFixed(0)}% of ${fmt(goal.target_amount)}
                  </Text>
                  {!done && (
                    <TouchableOpacity
                      onPress={() => openDepositModal(goal)}
                      style={{
                        backgroundColor: 'rgba(34,197,94,0.12)',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '600' }}>+ Deposit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* New Goal Modal */}
      <Modal visible={newModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
            activeOpacity={1}
            onPress={() => setNewModalVisible(false)}
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
              New Savings Goal
            </Text>

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Goal Name</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="e.g. Emergency Fund"
              placeholderTextColor="#52525b"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Target Amount ($)</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="1000.00"
              placeholderTextColor="#52525b"
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
            />

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Suggested Daily Saving ($)</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="5.00"
              placeholderTextColor="#52525b"
              value={dailyContribution}
              onChangeText={setDailyContribution}
              keyboardType="numeric"
            />

            {formError !== '' && (
              <Text style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{formError}</Text>
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
              {saving ? <ActivityIndicator color="#0a0a0a" /> : (
                <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={depositModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
            activeOpacity={1}
            onPress={() => setDepositModalVisible(false)}
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
            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
              Add Deposit
            </Text>
            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 24 }}>
              {depositGoal?.name}
            </Text>

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Amount ($)</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="0.00"
              placeholderTextColor="#52525b"
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
              autoFocus
            />

            {depositError !== '' && (
              <Text style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{depositError}</Text>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: '#22c55e',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: depositing ? 0.7 : 1,
              }}
              onPress={handleDeposit}
              disabled={depositing}
            >
              {depositing ? <ActivityIndicator color="#0a0a0a" /> : (
                <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Confirm Deposit</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
