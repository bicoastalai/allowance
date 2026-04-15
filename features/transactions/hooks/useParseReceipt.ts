/**
 * Sends a base64 receipt image to the parse-receipt edge function.
 * Returns ParsedReceipt with amount, vendor, and category pre-filled by GPT-4o vision.
 * Designed to be called from the AddTransactionModal camera flow.
 *
 * Example:
 *   const { mutateAsync: parseReceipt, isPending } = useParseReceipt();
 *   const result = await parseReceipt({ base64: '...', mimeType: 'image/jpeg' });
 *   // result: { amount: 12.50, vendor: 'Starbucks', category: 'Food' }
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ParsedReceipt } from '../types';

async function parseReceiptImage(base64: string, mimeType: string): Promise<ParsedReceipt> {
  const { data, error } = await supabase.functions.invoke('parse-receipt', {
    body: { imageBase64: base64, mimeType },
  });
  if (error) throw error;
  return data as ParsedReceipt;
}

export function useParseReceipt() {
  return useMutation({
    mutationFn: ({ base64, mimeType }: { base64: string; mimeType: string }) =>
      parseReceiptImage(base64, mimeType),
  });
}
