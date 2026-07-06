"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, getSession } from "@/lib/supabase";
import { ShieldCheck, CheckCircle2, BarChart3, Users, LifeBuoy } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSignIn } from "./MobileSignIn";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme") as "light" | "dark" | null;
    if (stored) {
      document.documentElement.classList.toggle("dark", stored === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

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

  if (isMobile) {
    return <MobileSignIn />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column: Brand & Value Prop */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background -z-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[0%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[100px] animate-pulse [animation-delay:3s]" />
        <div className="relative z-10 max-w-xl w-full">
          {/* Brand Section */}
          <div className="mb-16 flex items-center gap-4 group">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none">
                Q<span className="text-primary">R</span>4POS
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Administrator Interface</p>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-black tracking-tight leading-[1.1] text-foreground">
                Full Control Over <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                  Your Payment Network.
                </span>
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-lg">
                Supervise transactions, onboard merchants, oversee partner teams, and analyze performance from a single pane of glass.
              </p>
            </div>

            <div className="space-y-6 pt-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Partner & Merchant Oversight</h4>
                  <p className="text-sm text-muted-foreground">Manage partner organizations, their admins, and linked merchant terminals in one place.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Role-Based Admin Hierarchy</h4>
                  <p className="text-sm text-muted-foreground">Super admins and partner admins with scoped access across teams and levels.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <LifeBuoy className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Reporting & Dispute Resolution</h4>
                  <p className="text-sm text-muted-foreground">Generate reports, manage helpdesk tickets, and track Soundbox usage per partner.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-white/5">
            <p className="text-[10px] text-muted-foreground/40 tracking-[0.4em] uppercase font-black">
              Enterprise-Grade Payment Administration
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Sign In Form */}

      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none dark:invert" />
        <div className="w-full max-w-md">
          <div className="glass-card p-8 shadow-2xl border-primary/10">
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
