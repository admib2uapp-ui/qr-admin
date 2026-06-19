"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, type JSX } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, getSession } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: 'super_admin' | 'company_admin';
}

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminRecord = useCallback(async (accessToken?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      const res = await fetch('/api/admin/check', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.admin) {
          setAdminUser(data.admin);
        } else {
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchAdminRecord(session.access_token);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchAdminRecord(session.access_token);
      } else {
        setAdminUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAdminRecord]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, adminUser, loading, signOut: handleSignOut, refreshAdmin: async () => { const s = await getSession(); fetchAdminRecord(s?.access_token); } }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
