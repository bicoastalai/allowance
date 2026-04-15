/**
 * React Query mutation for inserting a new transaction.
 * On success, invalidates all transaction queries so lists and budget re-derive automatically.
 *
 * Example:
 *   const { mutateAsync: create, isPending } = useCreateTransaction();
 *   await create({ amount: 12.5, category: 'Food', transaction_date: '2025-04-15' });
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { createTransaction } from '../services/transactions';
import type { CreateTransactionInput } from '../types';

export function useCreateTransaction() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      createTransaction({ userId: session!.user.id, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
