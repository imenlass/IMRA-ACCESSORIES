'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Track which user IDs we've already claimed orders for in this session
  // so we don't fire the RPC on every TOKEN_REFRESHED / focus event.
  const claimedRef = useRef<Set<string>>(new Set());

  async function claimGuestOrdersForUser(userId: string) {
    if (claimedRef.current.has(userId)) return;
    claimedRef.current.add(userId);
    try {
      await supabase.rpc('claim_guest_orders');
    } catch (err) {
      // Non-fatal — just log. The user can still browse normally.
      // eslint-disable-next-line no-console
      console.warn('[auth] claim_guest_orders failed:', err);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) void claimGuestOrdersForUser(u.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      // Only claim on actual sign-in (or signup-with-immediate-session).
      // SIGNED_IN fires for both. Skip TOKEN_REFRESHED and USER_UPDATED.
      if (u && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        void claimGuestOrdersForUser(u.id);
      }
      if (event === 'SIGNED_OUT') {
        claimedRef.current.clear();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    claimedRef.current.clear();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
