"use client";

import { useState, useEffect } from "react";
import { Key, RefreshCw, Check, Copy, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api";

const KEY_MASK = "*".repeat(64);

interface KeyStatus {
  has_keys: boolean;
  worker_name: string;
  api_key_name: string | null;
}

export function MobileBankKeys() {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string> | null>(null);
  const [confirmType, setConfirmType] = useState<"generate" | "rotate" | null>(null);
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

  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <h1 className="font-black text-lg text-foreground tracking-tight">Bank API Keys</h1>
        </div>
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <h1 className="font-black text-lg text-foreground tracking-tight">Bank API Keys</h1>
      </div>

      <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 space-y-5">
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
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">{status.api_key_name}</p>
              <div className="flex items-center gap-2">
                <code className={`flex-1 p-2.5 rounded-lg text-xs font-mono tracking-wider border leading-none truncate ${revealedKeys?.[status.api_key_name] ? 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20' : 'bg-background text-muted-foreground/60 border-primary/10'}`}>
                  {revealedKeys?.[status.api_key_name] ?? KEY_MASK}
                </code>
                {revealedKeys?.[status.api_key_name] && (
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(revealedKeys[status.api_key_name!]!, status.api_key_name!)} className="h-9 w-9 p-0 shrink-0 rounded-lg">
                    {copiedField === status.api_key_name ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">BANK_WEBHOOK_SECRET</p>
              <div className="flex items-center gap-2">
                <code className={`flex-1 p-2.5 rounded-lg text-xs font-mono tracking-wider border leading-none truncate ${revealedKeys?.["BANK_WEBHOOK_SECRET"] ? 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20' : 'bg-background text-muted-foreground/60 border-primary/10'}`}>
                  {revealedKeys?.["BANK_WEBHOOK_SECRET"] ?? KEY_MASK}
                </code>
                {revealedKeys?.["BANK_WEBHOOK_SECRET"] && (
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(revealedKeys["BANK_WEBHOOK_SECRET"]!, "BANK_WEBHOOK_SECRET")} className="h-9 w-9 p-0 shrink-0 rounded-lg">
                    {copiedField === "BANK_WEBHOOK_SECRET" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        {status && !status.has_keys && (
          <p className="text-xs text-muted-foreground">No keys generated yet</p>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

          <div className="space-y-3">
          <Button onClick={() => setConfirmType("generate")} disabled={generating || rotating} className="w-full h-11 rounded-xl text-sm font-black uppercase tracking-widest">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            {generating ? "Generating..." : status?.has_keys ? "Regenerate Keys" : "Generate Keys"}
          </Button>
          <Button onClick={() => setConfirmType("rotate")} disabled={generating || rotating} variant="outline" className="w-full h-11 rounded-xl text-sm font-black uppercase tracking-widest">
            {rotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {rotating ? "Rotating..." : "Rotate Webhook Secret"}
          </Button>
        </div>

        <ConfirmDialog
          open={confirmType === "generate"}
          onOpenChange={(o) => { if (!o) setConfirmType(null); }}
          title="Generate New Keys?"
          description="This will create new API key and webhook secret. The current keys will stop working immediately."
          confirmLabel="Generate"
          onConfirm={handleGenerate}
          loading={generating}
        />

        <ConfirmDialog
          open={confirmType === "rotate"}
          onOpenChange={(o) => { if (!o) setConfirmType(null); }}
          title="Rotate Webhook Secret?"
          description="A new webhook secret will replace the current one. The old secret will stop working immediately."
          confirmLabel="Rotate"
          onConfirm={handleRotate}
          loading={rotating}
        />
      </div>
    </div>
  );
}
