/**
 * Calculates the user's daily allowance and current running balance for the month.
 * Derives from React Query caches for transactions and recurring_expenses,
 * so it re-derives automatically whenever a transaction is added or deleted.
 *
 * Returns:
 *   - dailyAllowance: daily spending target in dollars
 *   - currentBalance: how much allowance is left/over so far today
 *   - isOverBudget: true if recurring expenses exceed income
 *   - isLoading: true while either query is fetching
 *
 * Example:
 *   const { dailyAllowance, currentBalance, isOverBudget, isLoading } = useDailyBudget(profile);
 */
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { useTransactions } from './useTransactions';
import type { Profile } from '@/context/ProfileContext';

export function useDailyBudget(profile: Profile | null) {
  const { session } = useSession();
  const userId = session?.user.id;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const { data: transactions = [], isLoading: txnLoading } = useTransactions({
    fromDate: firstOfMonth,
  });

  const { data: recurringExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['recurring_expenses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('amount')
        .eq('user_id', userId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const isLoading = txnLoading || expensesLoading || !profile;

  if (!profile) {
    return { dailyAllowance: 0, currentBalance: 0, isOverBudget: false, isLoading: true };
  }

  const totalRecurring = recurringExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const savings = profile.monthly_income * (profile.savings_goal_percent / 100);
  const rawDaily = (profile.monthly_income - totalRecurring - savings) / daysInMonth;
  const isOverBudget = isNaN(rawDaily) || rawDaily < 0;
  const dailyAllowance = isOverBudget ? 0 : rawDaily;
  const currentBalance = dailyAllowance * today - totalSpent;

  return { dailyAllowance, currentBalance, isOverBudget, isLoading };
}
