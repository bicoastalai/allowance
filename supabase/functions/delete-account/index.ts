import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * delete-account
 *
 * Deletes the authenticated user's data and auth record.
 * Called from the app's Settings screen after the user confirms deletion.
 *
 * Flow:
 *   1. Verify the caller's JWT to get the user ID.
 *   2. Delete all user-owned rows from every table.
 *   3. Delete the auth.users record via the service-role admin client.
 *
 * Example:
 *   supabase.functions.invoke('delete-account')
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // User client — validates the JWT and retrieves the authenticated user.
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const userId = user.id;

  // Admin client — used for privileged operations (deleting auth user).
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Delete all user-owned data. Order matters: child tables before parent tables.
  const tables = [
    'transactions',
    'recurring_expenses',
    'children',
    'savings_goals',
    'profiles',
  ];

  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq('user_id', userId);
    if (error) {
      console.error(`Error deleting from ${table}:`, error.message);
    }
  }

  // Delete the auth user record itself.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('Error deleting auth user:', deleteError.message);
    return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
