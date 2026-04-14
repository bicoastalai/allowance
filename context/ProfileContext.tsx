import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  monthly_income: number;
  savings_goal_percent: number;
  is_premium: boolean;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refetch: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, monthly_income, savings_goal_percent, is_premium')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refetch();
    });
    return () => subscription.unsubscribe();
  }, [refetch]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refetch }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  return useContext(ProfileContext);
}
