"use client";

import { useState, useEffect } from "react";
import { Key, RefreshCw, Check, Copy, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
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

interface GeneratedKeys {
  api_key: string;
  api_key_name: string;
  webhook_secret: string;
  worker_name: string;
}

interface RotatedKeys {
  new_webhook_secret: string;
  worker_name: string;
  message: string;
}

export default function BankKeySection() {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeys | null>(null);
  const [rotatedKeys, setRotatedKeys] = useState<RotatedKeys | null>(null);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revealKeys, setRevealKeys] = useState(false);

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
    setGeneratedKeys(null);
    setRotatedKeys(null);

    try {
      const res = await apiFetch("/api/admin/bank-keys/generate", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate keys");
        return;
      }

      setGeneratedKeys(data);
      setRevealKeys(true);
      await fetchStatus();
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
    setRotatedKeys(null);

    try {
      const res = await apiFetch("/api/admin/bank-keys/rotate", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to rotate secret");
        return;
      }

      setRotatedKeys(data);
      setRevealKeys(true);
      await fetchStatus();
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

  const maskKey = (key: string) => {
    if (!revealKeys) return `${key.slice(0, 8)}...${key.slice(-4)}`;
    return key;
  };

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
            <div className="flex items-center gap-4">
              <span className="text-sm font-black uppercase tracking-widest text-muted-foreground shrink-0 w-[200px]">{status.api_key_name}</span>
              <code className="block p-3 rounded-xl bg-background text-sm font-mono tracking-wider border border-primary/10 leading-none w-fit min-w-[400px] whitespace-nowrap">
                {KEY_MASK}
              </code>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-black uppercase tracking-widest text-muted-foreground shrink-0 w-[200px]">BANK_WEBHOOK_SECRET</span>
              <code className="block p-3 rounded-xl bg-background text-sm font-mono tracking-wider border border-primary/10 leading-none w-fit min-w-[400px] whitespace-nowrap">
                {KEY_MASK}
              </code>
            </div>
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

        {generatedKeys && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Keys Generated — copy these now, they won't be shown again</span>
              <Button variant="ghost" size="sm" onClick={() => setRevealKeys(!revealKeys)} className="h-8 px-2">
                {revealKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{generatedKeys.api_key_name}</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded-lg bg-background text-xs font-mono break-all border border-primary/10">
                    {maskKey(generatedKeys.api_key)}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedKeys.api_key, "api_key")} className="h-8 w-8 p-0 shrink-0">
                    {copiedField === "api_key" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">BANK_WEBHOOK_SECRET</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded-lg bg-background text-xs font-mono break-all border border-primary/10">
                    {maskKey(generatedKeys.webhook_secret)}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedKeys.webhook_secret, "webhook")} className="h-8 w-8 p-0 shrink-0">
                    {copiedField === "webhook" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {rotatedKeys && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 block">Webhook Secret Rotated</span>
            <p className="text-xs text-muted-foreground">{rotatedKeys.message}</p>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">New BANK_WEBHOOK_SECRET</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 rounded-lg bg-background text-xs font-mono break-all border border-primary/10">
                  {maskKey(rotatedKeys.new_webhook_secret)}
                </code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(rotatedKeys.new_webhook_secret, "rotated")} className="h-8 w-8 p-0 shrink-0">
                  {copiedField === "rotated" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
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
