/**
 * Supabase CRUD operations for the transactions table.
 * All functions throw on error — callers (React Query hooks) handle error state.
 *
 * Example:
 *   const txns = await listTransactions({ userId, fromDate: '2025-04-01' });
 *   await createTransaction({ userId, amount: 12.5, category: 'Food', transaction_date: '2025-04-15' });
 */
import { supabase } from '@/lib/supabase';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '../types';

export async function listTransactions(params: {
  userId: string;
  fromDate: string;
  toDate?: string;
}): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('id, user_id, amount, category, note, transaction_date')
    .eq('user_id', params.userId)
    .gte('transaction_date', params.fromDate)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (params.toDate) {
    query = query.lte('transaction_date', params.toDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Transaction[];
}

export async function createTransaction(
  input: CreateTransactionInput & { userId: string },
): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    user_id: input.userId,
    amount: input.amount,
    category: input.category,
    note: input.note ?? null,
    transaction_date: input.transaction_date,
  });
  if (error) throw error;
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ amount: input.amount, category: input.category, note: input.note ?? null })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
