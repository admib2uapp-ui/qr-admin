"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, getSession } from "@/lib/supabase";
import { QrCode, Lock, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, Timer } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [state, setState] = useState<"waiting" | "ready" | "expired">("waiting");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session?.user) {
        setState("ready");
      }
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setState("ready");
      }
    });

    timeoutRef.current = setTimeout(() => {
      setState((prev) => (prev === "waiting" ? "expired" : prev));
    }, 10000);

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/signin?password_updated=true");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

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
          <p className="text-lg text-muted-foreground font-medium">Choose a new password for your account</p>
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

            <h2 className="text-3xl font-black text-foreground mb-1 tracking-tight uppercase">
              {state === "expired" && "Link Expired"}
              {state === "waiting" && "Checking Link..."}
              {state === "ready" && "New Password"}
              {success && "Password Updated"}
            </h2>
            <p className="text-muted-foreground font-medium mb-8">
              {state === "expired" && "This password reset link is no longer valid"}
              {state === "waiting" && "Verifying your reset link..."}
              {state === "ready" && "Enter your new password below"}
              {success && "Your password has been changed successfully"}
            </p>

            {error && (
              <div className="bg-rose-500/10 text-rose-500 text-sm p-4 rounded-xl mb-6 border border-rose-500/20 animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 text-emerald-500 text-sm p-4 rounded-xl mb-6 border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Password updated! Redirecting to sign in...</span>
              </div>
            )}

            {state === "waiting" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
              </div>
            )}

            {state === "expired" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Timer className="h-8 w-8 text-amber-500" />
                </div>
                <p className="text-muted-foreground text-sm text-center">
                  This link has expired. Please request a new password reset.
                </p>
                <Link
                  href="/forgot-password"
                  className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  Request New Link
                </Link>
              </div>
            )}

            {state === "ready" && !success && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">New Password</label>
                  <div className="relative group">
                    <div className="flex items-center bg-primary/5 border border-primary/10 rounded-xl px-4 h-14 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <Lock className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="flex-1 bg-transparent border-none outline-none text-lg text-foreground font-medium pr-12"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Confirm New Password</label>
                  <div className="flex items-center bg-primary/5 border border-primary/10 rounded-xl px-4 h-14 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Lock className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent border-none outline-none text-lg text-foreground font-medium"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/signin"
                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
