import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
};

export function useStreak(dailyAllowance: number): StreakResult {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const calculate = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || dailyAllowance <= 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('transaction_date, amount')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: true });

    if (error || !data || data.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      setLoading(false);
      return;
    }

    // Build a map of date string -> total spent
    const spendByDay: Record<string, number> = {};
    for (const row of data) {
      const d = row.transaction_date as string;
      spendByDay[d] = (spendByDay[d] ?? 0) + Number(row.amount);
    }

    // Iterate from the first transaction date to today
    const firstDate = new Date(data[0].transaction_date as string);
    const today = new Date();
    // Normalize to midnight UTC to avoid timezone edge cases
    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let current = 0;
    let longest = 0;
    let running = 0;

    const cursor = new Date(firstDate);
    while (cursor <= today) {
      const key = toDateStr(cursor);
      const spent = spendByDay[key] ?? 0;
      if (spent <= dailyAllowance) {
        running += 1;
        if (running > longest) longest = running;
      } else {
        running = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // current streak ends on today
    current = running;

    setCurrentStreak(current);
    setLongestStreak(longest);
    setLoading(false);
  }, [dailyAllowance]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { currentStreak, longestStreak, loading };
}
