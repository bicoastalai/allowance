export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Home',
  'Other',
] as const;

export type Category = (typeof DEFAULT_CATEGORIES)[number];
