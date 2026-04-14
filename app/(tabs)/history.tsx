import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { DEFAULT_CATEGORIES, type Category } from '@/constants/categories';

type Transaction = {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  transaction_date: string;
};

type GroupedTransactions = {
  date: string;
  items: Transaction[];
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

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

export default function HistoryScreen() {
  const [groups, setGroups] = useState<GroupedTransactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Other');
  const [editNote, setEditNote] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('transactions')
      .select('id, amount, category, note, transaction_date')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    const transactions: Transaction[] = data ?? [];

    const map = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const existing = map.get(t.transaction_date) ?? [];
      existing.push(t);
      map.set(t.transaction_date, existing);
    }

    setGroups(
      Array.from(map.entries()).map(([date, items]) => ({ date, items })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete this expense?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('transactions').delete().eq('id', id);
          fetchTransactions();
        },
      },
    ]);
  }

  function openEdit(t: Transaction) {
    setEditTarget(t);
    setEditAmount(String(t.amount));
    setEditCategory(t.category as Category);
    setEditNote(t.note ?? '');
    setEditError('');
  }

  async function handleEditSave() {
    const amt = Number(editAmount);
    if (!editAmount.trim() || isNaN(amt) || amt <= 0) {
      setEditError('Enter a valid amount.');
      return;
    }
    setEditError('');
    setEditSaving(true);

    const { error } = await supabase
      .from('transactions')
      .update({
        amount: amt,
        category: editCategory,
        note: editNote.trim() || null,
      })
      .eq('id', editTarget!.id);

    setEditSaving(false);
    if (error) { setEditError(error.message); return; }
    setEditTarget(null);
    fetchTransactions();
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#22c55e" />}
      >
        <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '700', marginBottom: 24 }}>
          History
        </Text>

        {groups.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 16 }}>No transactions yet</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.date} style={{ marginBottom: 28 }}>
              <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {formatDate(group.date)}
              </Text>
              <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a' }}>
                {group.items.map((t, idx) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => openEdit(t)}
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
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '500' }}>
                        {t.category}
                      </Text>
                      {t.note ? (
                        <Text style={{ color: '#a1a1aa', fontSize: 13, marginTop: 2 }}>{t.note}</Text>
                      ) : null}
                    </View>
                    <Text style={{ color: '#f87171', fontSize: 15, fontWeight: '600', marginRight: 12 }}>
                      -${fmt(t.amount)}
                    </Text>
                    <TouchableOpacity onPress={() => confirmDelete(t.id)} hitSlop={8}>
                      <Text style={{ color: '#f87171', fontSize: 18, fontWeight: '700' }}>×</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editTarget} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
            activeOpacity={1}
            onPress={() => setEditTarget(null)}
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
              Edit Expense
            </Text>

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Amount ($)</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="0.00"
              placeholderTextColor="#52525b"
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              autoFocus
            />

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 10 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {DEFAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setEditCategory(cat)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: editCategory === cat ? '#22c55e' : '#27272a',
                    backgroundColor: editCategory === cat ? 'rgba(34,197,94,0.15)' : '#18181b',
                  }}
                >
                  <Text style={{ color: editCategory === cat ? '#22c55e' : '#a1a1aa', fontSize: 14 }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Note (optional)</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="What was this for?"
              placeholderTextColor="#52525b"
              value={editNote}
              onChangeText={setEditNote}
            />

            {editError !== '' && (
              <Text style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{editError}</Text>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: '#22c55e',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: editSaving ? 0.7 : 1,
              }}
              onPress={handleEditSave}
              disabled={editSaving}
            >
              {editSaving ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
