import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

type AdminContext = {
  user: User;
  supabase: ReturnType<typeof createClient>;
};

/**
 * Server-side guard: redirects to login if not authenticated,
 * to /not-admin if signed in but not an admin.
 */
export async function requireAdmin(currentPath: string = '/admin'): Promise<AdminContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/admin-login?redirect=${encodeURIComponent(currentPath)}`);
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!admin) {
    redirect('/not-admin');
  }

  return { user, supabase };
}

/** Lighter check that doesn't redirect — returns boolean. */
export async function isAdmin(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return !!data;
}
