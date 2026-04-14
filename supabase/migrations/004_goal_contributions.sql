CREATE TABLE IF NOT EXISTS goal_contributions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  contributed_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goal contributions"
  ON goal_contributions FOR ALL
  USING (auth.uid() = user_id);
