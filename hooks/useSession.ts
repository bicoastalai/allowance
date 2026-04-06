/**
 * Returns the current Supabase auth session and a loading boolean.
 *
 * Fetches the session on mount, then subscribes to auth state changes
 * so the returned value stays in sync. Cleans up the subscription on unmount.
 *
 * Example:
 *   const { session, loading } = useSession();
 *   if (loading) return <Spinner />;
 *   if (!session) return <Redirect href="/(auth)/login" />;
 */
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
