"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, ArrowUpDown } from "lucide-react";
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

function HighlightText({ text, search }: { text: string; search: string }) {
  if (!search || !text) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(search.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-300/30 text-foreground rounded px-0.5 font-bold">{text.slice(idx, idx + search.length)}</span>
      {text.slice(idx + search.length)}
    </>
  );
}

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rangePreset, setRangePreset] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [qrTypeFilter, setQrTypeFilter] = useState("ALL");

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

  const formatLKR = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        [t.user_name, t.reference_no, t.merchant_name, t.merchant_id_str, t.status, t.tag, t.amount.toString(), new Date(t.created_at).toLocaleDateString('en-LK')]
          .some(val => val?.toLowerCase().includes(s))
      );
    }

    if (startDate) {
      const s = startOfDay(new Date(startDate + 'T00:00:00'));
      result = result.filter(t => new Date(t.created_at) >= s);
    }
    if (endDate) {
      const e = endOfDay(new Date(endDate + 'T23:59:59'));
      result = result.filter(t => new Date(t.created_at) <= e);
    }

    if (statusFilter !== "ALL") {
      result = result.filter(t => t.status === statusFilter);
    }

    if (methodFilter === 'CASH') {
      result = result.filter(t => t.tag === 'CASH');
    } else if (methodFilter === 'CREDIT') {
      result = result.filter(t => t.tag === 'CREDIT');
    } else if (methodFilter === 'QR') {
      result = result.filter(t => t.tag !== 'CASH' && t.tag !== 'CREDIT');
      if (qrTypeFilter !== 'ALL') {
        result = result.filter(t => (t.tag || 'DYNAMIC') === qrTypeFilter);
      }
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'user_name':
          cmp = a.user_name.localeCompare(b.user_name);
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'created_at':
        default:
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, search, startDate, endDate, statusFilter, methodFilter, qrTypeFilter, sortField, sortDir]);

  const filteredTotal = useMemo(() => {
    return filtered.reduce((sum, t) => sum + t.amount, 0);
  }, [filtered]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleRangePreset = (preset: string) => {
    setRangePreset(preset);
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
      return;
    }
    if (preset === 'CUSTOM') return;
    let start = new Date();
    let end = new Date();
    switch (preset) {
      case 'TODAY':
        start = startOfDay(new Date());
        end = endOfDay(new Date());
        break;
      case 'YESTERDAY':
        start = startOfDay(subDays(new Date(), 1));
        end = endOfDay(subDays(new Date(), 1));
        break;
      case 'THIS_WEEK':
        start = startOfWeek(new Date(), { weekStartsOn: 1 });
        end = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'LAST_WEEK':
        start = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
        break;
      case 'THIS_MONTH':
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
        break;
      case 'LAST_MONTH':
        start = startOfMonth(subMonths(new Date(), 1));
        end = endOfMonth(subMonths(new Date(), 1));
        break;
    }
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const getStatusBadge = (status: string) => {
    const label = status === 'FAILED' ? 'CANCELLED' : status;
    const badge = (className: string) => (
      <Badge variant="outline" className={className}>
        <HighlightText text={label} search={search} />
      </Badge>
    );
    switch (status) {
      case 'SUCCESS':
        return badge("rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20");
      case 'FAILED':
        return badge("rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-destructive/10 text-destructive border-destructive/20");
      case 'PENDING':
        return badge("rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-amber-500/10 text-amber-600 border-amber-500/20");
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
      <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-[4vw] sm:text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            {statusFilter === 'ALL' ? 'All' : statusFilter === 'SUCCESS' ? 'Success' : statusFilter === 'FAILED' ? 'Failed' : 'Pending'} Transactions
            <span className="text-[2vw] sm:text-xs font-bold text-muted-foreground">({filtered.length})</span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[4vw] sm:text-lg font-black text-primary tabular-nums">{formatLKR(filteredTotal)}</p>
            </div>
            <Button onClick={fetchTransactions} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by user, reference, merchant..."
              className="pl-9 h-12 rounded-xl border-primary/10 bg-primary/5 text-sm"
            />
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setRangePreset('CUSTOM'); }}
            className="w-full sm:w-[170px] h-12 rounded-xl text-xs font-bold bg-primary/5 border-primary/10"
          />
          <span className="hidden sm:flex items-center text-muted-foreground text-xs font-bold">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setRangePreset('CUSTOM'); }}
            className="w-full sm:w-[170px] h-12 rounded-xl text-xs font-bold bg-primary/5 border-primary/10"
          />
          <Select value={rangePreset} onValueChange={handleRangePreset}>
            <SelectTrigger className="w-full sm:w-[150px] h-12 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Time</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="YESTERDAY">Yesterday</SelectItem>
              <SelectItem value="THIS_WEEK">This Week</SelectItem>
              <SelectItem value="LAST_WEEK">Last Week</SelectItem>
              <SelectItem value="THIS_MONTH">This Month</SelectItem>
              <SelectItem value="LAST_MONTH">Last Month</SelectItem>
              <SelectItem value="CUSTOM">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-12 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); if (v !== 'QR') setQrTypeFilter('ALL'); }}>
            <SelectTrigger className="w-full sm:w-[140px] h-12 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Methods</SelectItem>
              <SelectItem value="QR">QR</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="CREDIT">Credit</SelectItem>
            </SelectContent>
          </Select>
          {methodFilter === 'QR' && (
            <Select value={qrTypeFilter} onValueChange={setQrTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-12 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
                <SelectValue placeholder="QR Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All QR</SelectItem>
                <SelectItem value="DYNAMIC">Dynamic</SelectItem>
                <SelectItem value="STATIC">Static</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setMethodFilter("ALL");
              setQrTypeFilter("ALL");
              setStartDate("");
              setEndDate("");
              setRangePreset("ALL");
            }}
            className="h-12 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground"
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-[3vw] sm:p-4 pt-0">
        <div className="rounded-xl border border-primary/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow className="border-primary/10 hover:bg-transparent">
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] cursor-pointer" onClick={() => handleSort('created_at')}>
                  Date <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Reference</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] cursor-pointer" onClick={() => handleSort('user_name')}>
                  User <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Merchant</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] cursor-pointer" onClick={() => handleSort('amount')}>
                  Amount <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-primary/5">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t, idx) => (
                  <TableRow key={t.transaction_uuid || `tx-${idx}`} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                    <TableCell className="text-[2.5vw] sm:text-xs font-medium">
                      <HighlightText text={new Date(t.created_at).toLocaleDateString('en-LK')} search={search} />
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      <HighlightText text={t.reference_no} search={search} />
                    </TableCell>
                    <TableCell className="font-bold">
                      <HighlightText text={t.user_name} search={search} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <HighlightText text={t.merchant_name} search={search} />
                    </TableCell>
                    <TableCell className="font-bold tabular-nums">
                      <HighlightText text={formatLKR(t.amount)} search={search} />
                    </TableCell>
                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
