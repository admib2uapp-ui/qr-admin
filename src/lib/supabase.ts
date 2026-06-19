import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

function initClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('Supabase URL and Anon Key must be set in environment variables');
    }
    _client = createClient(url, key, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    });
  }
  return _client;
}

function initAdmin(): SupabaseClient | null {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      _admin = createClient(url, key);
    }
  }
  return _admin || null;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (initClient() as any)[prop];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const a = initAdmin();
    if (!a) throw new Error('Service role key not configured');
    return (a as any)[prop];
  },
});

export interface AdminRecord {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export async function getSession() {
  return (await supabase.auth.getSession()).data.session;
}

export async function getAdminRecord(userId: string): Promise<AdminRecord | null> {
  const a = initAdmin();
  if (!a) return null;
  const { data } = await a.from('admins').select('*').eq('user_id', userId).single();
  return data as AdminRecord | null;
}
