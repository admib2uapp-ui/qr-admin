"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, getSession } from "@/lib/supabase";
import { QrCode, CheckCircle2 } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    if (searchParams.get("password_updated") === "true") {
      setPasswordUpdated(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session?.user) {
        try {
          const res = await fetch('/api/admin/check');
          if (res.ok) {
            const data = await res.json();
            if (data.admin) {
              router.push('/dashboard');
              return;
            }
          }
        } catch {}
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const { data: { session: newSession } } = await supabase.auth.getSession();
      const token = newSession?.access_token;

      const res = await fetch('/api/admin/check', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!res.ok) {
        await supabase.auth.signOut();
        setError("Access denied. You do not have admin privileges.");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (!data.admin) {
        await supabase.auth.signOut();
        setError("Access denied. You do not have admin privileges.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/20 via-primary/5 to-background items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
        <div className="relative z-10 max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <QrCode className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">QR Admin</h1>
          <p className="text-lg text-muted-foreground font-medium">Manage users, transactions, and reports in one place</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[#e9eff3] dark:bg-[#0f172a]">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 shadow-2xl border-primary/10">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <QrCode className="h-7 w-7" />
              </div>
            </div>

            <h2 className="text-3xl font-black text-foreground mb-1 tracking-tight uppercase">Welcome Back</h2>
            <p className="text-muted-foreground font-medium mb-8">Admin portal sign in</p>

            {passwordUpdated && (
              <div className="bg-emerald-500/10 text-emerald-500 text-sm p-4 rounded-xl mb-6 border border-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Password updated successfully. Sign in with your new password.</span>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 text-rose-500 text-sm p-4 rounded-xl mb-6 border border-rose-500/20 animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-3">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                <div className="flex items-center bg-primary/5 border border-primary/10 rounded-xl px-4 h-14 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="flex-1 bg-transparent outline-none text-lg text-foreground font-medium"
                    autoCapitalize="none"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                <div className="relative group">
                  <div className="flex items-center bg-primary/5 border border-primary/10 rounded-xl px-4 h-14 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent border-none outline-none text-lg text-foreground font-medium tracking-widest pr-12"
                      autoCapitalize="none"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors text-xs font-black uppercase z-10"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
