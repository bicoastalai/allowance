/**
 * Fetches and caches transactions for a date range via React Query.
 * Query key encodes userId + date range so results are scoped per user/period.
 *
 * Example:
 *   const { data: transactions = [], isLoading } = useTransactions({ fromDate: '2025-04-01' });
 */
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { listTransactions } from '../services/transactions';

export function useTransactions(params: { fromDate: string; toDate?: string }) {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['transactions', userId, params.fromDate, params.toDate],
    queryFn: () => listTransactions({ userId: userId!, ...params }),
    enabled: !!userId,
  });
}
