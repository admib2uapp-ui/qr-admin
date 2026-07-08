"use client";

import { useState, useEffect } from "react";
import { Key, RefreshCw, Check, Copy, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

const KEY_MASK = "*".repeat(64);

interface KeyStatus {
  has_keys: boolean;
  worker_name: string;
  api_key_name: string | null;
}

export default function BankKeySection() {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/bank-keys/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleGenerate = async () => {
    if (!confirm("Generate new bank API keys? The current keys will stop working immediately.")) return;

    setGenerating(true);
    setError("");

    try {
      const res = await apiFetch("/api/admin/bank-keys/generate", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate keys");
        return;
      }

      setStatus(prev => prev ? { ...prev, has_keys: true, api_key_name: data.api_key_name } : prev);
      setRevealedKeys({ [data.api_key_name]: data.api_key, BANK_WEBHOOK_SECRET: data.webhook_secret });
    } catch {
      setError("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const handleRotate = async () => {
    if (!confirm("Rotate webhook secret? The old secret will stop working immediately.")) return;

    setRotating(true);
    setError("");

    try {
      const res = await apiFetch("/api/admin/bank-keys/rotate", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to rotate secret");
        return;
      }

      setRevealedKeys({ BANK_WEBHOOK_SECRET: data.new_webhook_secret });
    } catch {
      setError("Network error");
    } finally {
      setRotating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderKeyRow = (keyName: string, displayValue: string, copyKey: string, highlighted: boolean) => (
    <div className={`flex items-center gap-4 ${highlighted ? 'p-3 -mx-3 -my-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20' : ''}`}>
      <span className={`text-sm font-black uppercase tracking-widest shrink-0 w-[200px] ${highlighted ? 'text-emerald-600' : 'text-muted-foreground'}`}>{keyName}</span>
      <code className={`block p-3 rounded-xl text-sm font-mono tracking-wider leading-none w-fit min-w-[400px] whitespace-nowrap border ${highlighted ? 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20' : 'bg-background text-muted-foreground/60 border-primary/10'}`}>
        {displayValue}
      </code>
      {highlighted && (
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(displayValue, copyKey)} className="h-10 w-10 p-0 shrink-0 rounded-xl">
          {copiedField === copyKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            <Key className="h-5 w-5" /> Bank API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
      <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
        <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
          <Key className="h-5 w-5" /> Bank API Keys
        </CardTitle>
      </CardHeader>
      <CardContent className="p-[3vw] sm:p-4 pt-0 space-y-4">
        {status && (
          <div className="flex items-center gap-2">
            <Badge
              variant={status.has_keys ? "default" : "outline"}
              className="rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest"
            >
              {status.has_keys ? "Keys Generated" : "No Keys"}
            </Badge>
          </div>
        )}

        {status?.has_keys && status.api_key_name && (
          <div className="space-y-2">
            {renderKeyRow(
              status.api_key_name,
              revealedKeys?.[status.api_key_name] ?? KEY_MASK,
              status.api_key_name,
              !!revealedKeys?.[status.api_key_name]
            )}
            {renderKeyRow(
              "BANK_WEBHOOK_SECRET",
              revealedKeys?.["BANK_WEBHOOK_SECRET"] ?? KEY_MASK,
              "BANK_WEBHOOK_SECRET",
              !!revealedKeys?.["BANK_WEBHOOK_SECRET"]
            )}
          </div>
        )}
        {status && !status.has_keys && (
          <p className="text-xs text-muted-foreground">No keys generated yet</p>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-bold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 justify-end">
          <Button onClick={handleGenerate} disabled={generating} className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            {generating ? "Generating..." : status?.has_keys ? "Regenerate Keys" : "Generate Keys"}
          </Button>
          <Button onClick={handleRotate} disabled={rotating} variant="outline" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
            {rotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {rotating ? "Rotating..." : "Rotate Webhook Secret"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
