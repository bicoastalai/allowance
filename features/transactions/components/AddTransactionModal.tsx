import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { DEFAULT_CATEGORIES, type Category } from '@/constants/categories';
import { useCreateTransaction } from '../hooks/useCreateTransaction';
import { ReceiptScanner } from './ReceiptScanner';
import type { ParsedReceipt } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

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

/**
 * Bottom-sheet modal for logging a new transaction.
 * Supports manual entry or receipt scanning (camera → GPT-4o pre-fill).
 * All OCR-parsed fields are editable before saving.
 */
export function AddTransactionModal({ visible, onClose, onSuccess }: Props) {
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();

  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [error, setError] = useState('');

  function reset() {
    setAmount('');
    setVendor('');
    setCategory('Other');
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleParsed(receipt: ParsedReceipt) {
    if (receipt.amount !== null) setAmount(String(receipt.amount));
    if (receipt.vendor !== null) setVendor(receipt.vendor);
    if (receipt.category !== null) setCategory(receipt.category);
  }

  async function handleSave() {
    const amt = Number(amount);
    if (!amount.trim() || isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setError('');

    const now = new Date();
    const transaction_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
      await createTransaction({
        amount: amt,
        category,
        note: vendor.trim() || null,
        transaction_date,
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={{
            backgroundColor: '#111111',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 48,
            maxHeight: '85%',
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '700' }}>
                Log Expense
              </Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={{ color: '#52525b', fontSize: 22 }}>×</Text>
              </TouchableOpacity>
            </View>

            <ReceiptScanner onParsed={handleParsed} />

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Amount ($)</Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="0.00"
              placeholderTextColor="#52525b"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>
              Vendor / Note (optional)
            </Text>
            <TextInput
              style={INPUT_STYLE}
              placeholder="e.g. Starbucks, groceries…"
              placeholderTextColor="#52525b"
              value={vendor}
              onChangeText={setVendor}
            />

            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 10 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
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
                  <Text
                    style={{ color: category === cat ? '#22c55e' : '#a1a1aa', fontSize: 14 }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error !== '' && (
              <Text style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{error}</Text>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: '#22c55e',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: isPending ? 0.7 : 1,
              }}
              onPress={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>
                  Save Expense
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
