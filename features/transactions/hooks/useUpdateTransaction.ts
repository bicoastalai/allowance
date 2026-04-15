/**
 * React Query mutation for updating an existing transaction.
 * On success, invalidates all transaction queries.
 *
 * Example:
 *   const { mutateAsync: update } = useUpdateTransaction();
 *   await update({ id: 'abc', amount: 15, category: 'Food', note: 'Lunch' });
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTransaction } from '../services/transactions';
import type { UpdateTransactionInput } from '../types';

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateTransactionInput) =>
      updateTransaction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
