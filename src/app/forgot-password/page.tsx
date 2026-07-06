"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QrCode, ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(
        email
      );

      if (sendError) throw sendError;

      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const token = otp.join("");
    if (token.length !== 6) {
      setError("Please enter the complete 6-digit code");
      setIsLoading(false);
      return;
    }

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });

      if (verifyError) throw verifyError;

      setStep("success");
      setTimeout(() => {
        router.push("/update-password");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setIsLoading(true);

    try {
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(
        email
      );
      if (sendError) throw sendError;
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
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
          <p className="text-lg text-muted-foreground font-medium">Secure password reset via email</p>
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
              {step === "email" && "Reset Password"}
              {step === "otp" && "Check Your Email"}
              {step === "success" && "Verified!"}
            </h2>
            <p className="text-muted-foreground font-medium mb-8">
              {step === "email" && "Enter your email to receive a reset code"}
              {step === "otp" && `Enter the 6-digit code sent to ${email}`}
              {step === "success" && "Redirecting to set new password..."}
            </p>

            {error && (
              <div className="bg-rose-500/10 text-rose-500 text-sm p-4 rounded-xl mb-6 border border-rose-500/20 animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                  <div className="flex items-center bg-primary/5 border border-primary/10 rounded-xl px-4 h-14 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Mail className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Send Reset Code"
                  )}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-black bg-primary/5 border border-primary/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground"
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify Code"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-muted-foreground text-sm">Code verified successfully</p>
              </div>
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
