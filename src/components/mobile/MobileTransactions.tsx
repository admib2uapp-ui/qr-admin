"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, ChevronDown, ChevronUp, ArrowLeftRight, Banknote, CreditCard, QrCode } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Transaction {
  transaction_uuid: string;
  reference_no: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  created_at: string;
  user_name: string;
  merchant_name: string;
  merchant_id_str: string;
  tag: string | null;
}

const STATUS_FILTERS = ["ALL", "SUCCESS", "FAILED", "PENDING"] as const;

function statusBadge(status: string) {
  switch (status) {
    case 'SUCCESS':
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case 'FAILED':
      return "bg-destructive/10 text-destructive border-destructive/20";
    case 'PENDING':
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    default:
      return "";
  }
}

function methodIcon(tag: string | null) {
  if (tag === 'CASH') return <Banknote className="w-4 h-4" />;
  if (tag === 'CREDIT') return <CreditCard className="w-4 h-4" />;
  return <QrCode className="w-4 h-4" />;
}

function methodLabel(tag: string | null) {
  if (tag === 'CASH') return 'Cash';
  if (tag === 'CREDIT') return 'Credit';
  return 'QR';
}

export function MobileTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/transactions/list');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalAmount(data.totalAmount || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatLKR = (amount: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        [t.user_name, t.reference_no, t.merchant_name, t.merchant_id_str, t.status, t.tag, t.amount.toString()]
          .some(val => val?.toLowerCase().includes(s))
      );
    }
    if (startDate) result = result.filter(t => new Date(t.created_at) >= startOfDay(new Date(startDate)));
    if (endDate) result = result.filter(t => new Date(t.created_at) <= endOfDay(new Date(endDate)));
    if (statusFilter !== "ALL") result = result.filter(t => t.status === statusFilter);
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }, [transactions, search, startDate, endDate, statusFilter]);

  const filteredTotal = useMemo(() =>
    filtered.reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">Filtered total</p>
          <p className="text-xl font-black text-primary tabular-nums">{formatLKR(filteredTotal)}</p>
        </div>
        <Button onClick={fetchTransactions} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by user, reference, merchant..."
          className="pl-9 h-10 rounded-xl border-primary/10 bg-primary/5 text-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-primary/5 text-muted-foreground border-primary/10'
            }`}
          >
            {s === 'ALL' ? 'All' : s}
          </button>
        ))}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 border-primary/10 bg-primary/5 text-muted-foreground flex items-center gap-1"
        >
          Dates {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="flex-1 h-10 rounded-xl text-xs font-bold bg-primary/5 border-primary/10"
          />
          <Input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="flex-1 h-10 rounded-xl text-xs font-bold bg-primary/5 border-primary/10"
          />
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-primary/5 rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium">
            No transactions found
          </div>
        ) : (
          filtered.map((t, idx) => {
            const expanded = expandedId === t.transaction_uuid;
            return (
              <div key={t.transaction_uuid || `tx-${idx}`}>
                <div
                  onClick={() => setExpandedId(expanded ? null : t.transaction_uuid)}
                  className="bg-primary/5 rounded-xl p-4 border border-primary/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-bold text-sm truncate">{t.merchant_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.user_name}</p>
                    </div>
                    <p className="font-black text-lg tabular-nums shrink-0">{formatLKR(t.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-2 ${statusBadge(t.status)}`}>
                        {t.status === 'FAILED' ? 'CANCELLED' : t.status}
                      </Badge>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                        {methodIcon(t.tag)}
                        {methodLabel(t.tag)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('en-LK')}
                      {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
                {expanded && (
                  <div className="mx-4 px-4 py-3 bg-primary/5 border-x border-b border-primary/10 rounded-b-xl -mt-1 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-mono font-bold">{t.reference_no}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Merchant ID</span>
                      <span className="font-bold">{t.merchant_id_str}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-bold">{new Date(t.created_at).toLocaleTimeString('en-LK')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Method</span>
                      <span className="font-bold flex items-center gap-1">{methodIcon(t.tag)} {methodLabel(t.tag)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
