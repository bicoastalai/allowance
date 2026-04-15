import type { Category } from '@/constants/categories';

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  category: Category;
  note: string | null;
  transaction_date: string;
};

export type CreateTransactionInput = {
  amount: number;
  category: Category;
  note?: string | null;
  transaction_date: string;
};

export type UpdateTransactionInput = {
  amount: number;
  category: Category;
  note?: string | null;
};

export type ParsedReceipt = {
  amount: number | null;
  vendor: string | null;
  category: Category | null;
};
