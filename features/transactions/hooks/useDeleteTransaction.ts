/**
 * React Query mutation for deleting a transaction by id.
 * On success, invalidates all transaction queries.
 *
 * Example:
 *   const { mutate: remove } = useDeleteTransaction();
 *   remove('transaction-uuid');
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTransaction } from '../services/transactions';

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
