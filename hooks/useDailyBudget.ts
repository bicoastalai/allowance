/** @deprecated Use useDailyBudget from @/features/transactions instead. TODO: remove after all refs migrated. */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/context/ProfileContext';

export function useDailyBudget(profile: Profile | null) {
  const [dailyAllowance, setDailyAllowance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isOverBudget, setIsOverBudget] = useState(false);
  const [loading, setLoading] = useState(true);

  const calculate = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();
    const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const [expensesResult, transactionsResult] = await Promise.all([
      supabase
        .from('recurring_expenses')
        .select('amount')
        .eq('user_id', user.id),
      supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .gte('transaction_date', firstOfMonth),
    ]);

    const totalRecurring = (expensesResult.data ?? []).reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const totalSpent = (transactionsResult.data ?? []).reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const savings = profile.monthly_income * (profile.savings_goal_percent / 100);
    const rawDaily = (profile.monthly_income - totalRecurring - savings) / daysInMonth;
    const overBudget = isNaN(rawDaily) || rawDaily < 0;
    const daily = overBudget ? 0 : rawDaily;
    const balance = daily * today - totalSpent;

    setIsOverBudget(overBudget);
    setDailyAllowance(daily);
    setCurrentBalance(balance);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { dailyAllowance, currentBalance, isOverBudget, loading, refetch: calculate };
}
