import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Fetches a personalised spending insight from the `ai-coach` Supabase Edge
 * Function, which proxies the OpenAI API server-side so the API key is never
 * embedded in the client bundle.
 *
 * Deploy the edge function at:
 *   supabase/functions/ai-coach/index.ts
 * Set OPENAI_API_KEY in the Supabase project's function secrets.
 *
 * Example:
 *   const { insight, loading, error, refresh } = useAICoach(transactions, dailyAllowance, balance);
 */

type Transaction = {
  amount: number;
  category: string;
  transaction_date: string;
};

type AICoachResult = {
  insight: string;
  loading: boolean;
  error: string;
  refresh: () => void;
};

export function useAICoach(
  transactions: Transaction[],
  dailyAllowance: number,
  currentBalance: number,
): AICoachResult {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-coach', {
        body: { transactions, dailyAllowance, currentBalance },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.insight) throw new Error('Empty response from AI coach.');

      setInsight(data.insight as string);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load insight.');
    } finally {
      setLoading(false);
    }
  }, [transactions, dailyAllowance, currentBalance]);

  return { insight, loading, error, refresh };
}
