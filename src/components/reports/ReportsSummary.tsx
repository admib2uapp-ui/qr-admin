"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
} from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Loader2, Store } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SummaryTx {
  id: string;
  transaction_uuid: string;
  reference_no: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  created_at: string;
  merchant_id: string;
}

interface MerchantOption {
  id: string;
  merchant_id: string;
  merchant_name: string;
  bank_code: string;
}

const presetOptions = [
  { value: 'ALL', label: 'All Time' },
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'LAST_WEEK', label: 'Last Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_MONTH', label: 'Last Month' },
];

export default function ReportsSummary() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [rangePreset, setRangePreset] = useState('THIS_MONTH');
  const [chartMode, setChartMode] = useState<"daily" | "monthly" | "yearly">("daily");
  const [merchantFilter, setMerchantFilter] = useState('ALL');
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [transactions, setTransactions] = useState<SummaryTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMerchants, setLoadingMerchants] = useState(true);

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await apiFetch('/api/merchants/list');
        if (res.ok) {
          const data = await res.json();
          setMerchants(data.merchants || []);
        }
      } catch {
      } finally {
        setLoadingMerchants(false);
      }
    };
    fetchMerchants();
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (merchantFilter !== 'ALL') params.set('merchantId', merchantFilter);

      const res = await apiFetch(`/api/reports/summary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, merchantFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRangePreset = (preset: string) => {
    setRangePreset(preset);
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
      return;
    }

    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'TODAY':
        start = startOfDay(new Date());
        end = endOfDay(new Date());
        setChartMode("daily");
        break;
      case 'YESTERDAY':
        start = startOfDay(subDays(new Date(), 1));
        end = endOfDay(subDays(new Date(), 1));
        setChartMode("daily");
        break;
      case 'THIS_WEEK':
        start = startOfWeek(new Date(), { weekStartsOn: 1 });
        end = endOfWeek(new Date(), { weekStartsOn: 1 });
        setChartMode("daily");
        break;
      case 'LAST_WEEK':
        start = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
        setChartMode("daily");
        break;
      case 'THIS_MONTH':
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
        setChartMode("daily");
        break;
      case 'LAST_MONTH':
        start = startOfMonth(subMonths(new Date(), 1));
        end = endOfMonth(subMonths(new Date(), 1));
        setChartMode("daily");
        break;
    }
    if (preset !== 'ALL') {
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  const statusCalculations = useMemo(() => {
    const firstTxDate = transactions.length > 0 ? new Date(transactions[transactions.length - 1].created_at) : new Date();
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(firstTxDate);
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      diffDays,
      isDailyDisabled: rangePreset === 'ALL' || diffDays > 31,
      isMonthlyDisabled: diffDays <= 1 || diffDays > 366,
      isYearlyDisabled: diffDays <= 31,
    };
  }, [rangePreset, startDate, endDate, transactions]);

  useEffect(() => {
    const { diffDays } = statusCalculations;
    if (diffDays <= 31) {
      if (diffDays >= 1) setChartMode('daily');
    } else if (diffDays <= 366) {
      setChartMode('monthly');
    } else {
      setChartMode('yearly');
    }
  }, [startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.status !== 'SUCCESS') return false;
      const created = new Date(tx.created_at);
      if (startDate) {
        const s = startOfDay(new Date(startDate + 'T00:00:00'));
        if (created < s) return false;
      }
      if (endDate) {
        const e = endOfDay(new Date(endDate + 'T23:59:59'));
        if (created > e) return false;
      }
      return true;
    });
  }, [transactions, startDate, endDate]);

  const chartData = useMemo(() => {
    if (chartMode === 'yearly') {
      try {
        const firstTxDate = transactions.length > 0 ? new Date(transactions[transactions.length - 1].created_at) : new Date();
        const start = startDate ? startOfYear(new Date(startDate)) : startOfYear(firstTxDate);
        const end = endDate ? endOfYear(new Date(endDate)) : endOfYear(new Date());

        const yearsInRange = eachYearOfInterval({ start, end });
        const yearMap: Record<string, number> = {};
        yearsInRange.forEach(y => { yearMap[format(y, 'yyyy')] = 0; });

        filteredTransactions.forEach((tx) => {
          const date = new Date(tx.created_at);
          const yearKey = format(date, 'yyyy');
          if (yearMap[yearKey] !== undefined) {
            yearMap[yearKey] += Number(tx.amount) || 0;
          }
        });

        return Object.entries(yearMap).map(([key, amount]) => ({
          name: key,
          amount,
        }));
      } catch {
        return [];
      }
    } else if (chartMode === 'monthly') {
      try {
        const firstTxDate = transactions.length > 0 ? new Date(transactions[transactions.length - 1].created_at) : new Date();
        const start = startDate ? startOfMonth(new Date(startDate)) : startOfMonth(firstTxDate);
        const end = endDate ? endOfMonth(new Date(endDate)) : endOfMonth(new Date());

        const monthsInRange = eachMonthOfInterval({ start, end });
        const monthMap: Record<string, number> = {};
        monthsInRange.forEach(m => { monthMap[format(m, 'MMM yyyy')] = 0; });

        filteredTransactions.forEach((tx) => {
          const date = new Date(tx.created_at);
          const monthKey = format(date, 'MMM yyyy');
          if (monthMap[monthKey] !== undefined) {
            monthMap[monthKey] += Number(tx.amount) || 0;
          }
        });

        return Object.entries(monthMap).map(([key, amount]) => ({
          name: key.split(' ')[0],
          amount,
        }));
      } catch {
        return [];
      }
    } else {
      try {
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));

        const daysInRange = eachDayOfInterval({ start, end });
        const dayMap: Record<string, number> = {};
        daysInRange.forEach(day => { dayMap[format(day, 'yyyy-MM-dd')] = 0; });

        filteredTransactions.forEach((tx) => {
          const date = new Date(tx.created_at);
          const dayKey = format(date, 'yyyy-MM-dd');
          if (dayMap[dayKey] !== undefined) {
            dayMap[dayKey] += Number(tx.amount) || 0;
          }
        });

        return Object.entries(dayMap).map(([dayKey, amount]) => ({
          name: format(new Date(dayKey), 'd'),
          amount,
        }));
      } catch {
        return [];
      }
    }
  }, [filteredTransactions, chartMode, startDate, endDate]);

  const totalCount = filteredTransactions.length;
  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const selectedMerchant = merchants.find(m => m.id === merchantFilter);

  return (
    <div className="space-y-[4vw] sm:space-y-6 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4">
          <CardTitle className="text-[5vw] sm:text-xl font-black tracking-tight text-primary uppercase">Dashboard Filters</CardTitle>
          <CardDescription className="text-[3vw] sm:text-sm uppercase tracking-widest font-bold opacity-50">Refine your transaction analytics.</CardDescription>
        </CardHeader>
        <CardContent className="px-[4vw] py-[3vw] sm:p-4 space-y-[4vw] sm:space-y-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-[3vw] sm:gap-4">
            <Input
              type="date"
              className="w-full sm:w-[200px] h-[12vw] sm:h-12 rounded-[2.5vw] sm:rounded-xl text-[3.5vw] sm:text-sm font-bold bg-primary/5 border-primary/10"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="hidden sm:inline text-muted-foreground">-</span>
            <Input
              type="date"
              className="w-full sm:w-[200px] h-[12vw] sm:h-12 rounded-[2.5vw] sm:rounded-xl text-[3.5vw] sm:text-sm font-bold bg-primary/5 border-primary/10"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setRangePreset('CUSTOM');
              }}
            />

            <Select value={rangePreset} onValueChange={handleRangePreset}>
              <SelectTrigger className="w-full sm:w-[160px] h-12 border-primary/10 bg-primary/5 font-black text-[10px] uppercase tracking-widest rounded-xl">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {presetOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
                <SelectItem value="CUSTOM">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <Select value={merchantFilter} onValueChange={setMerchantFilter} disabled={loadingMerchants}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 border-primary/10 bg-primary/5 font-black text-[10px] uppercase tracking-widest rounded-xl">
                <SelectValue placeholder={loadingMerchants ? "Loading..." : "All Merchants"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Merchants</SelectItem>
                {merchants.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.merchant_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMerchant && (
              <div className="flex-1 min-w-[200px] h-[12vw] sm:h-12 rounded-[2.5vw] sm:rounded-xl bg-primary/5 border border-primary/10 px-4 flex items-center gap-3">
                <Store className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[3vw] sm:text-sm font-black text-foreground truncate">
                    {selectedMerchant.merchant_name}
                  </span>
                  <span className="text-[2.2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                    {selectedMerchant.bank_code}
                  </span>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                setMerchantFilter('ALL');
                setRangePreset('THIS_MONTH');
              }}
              className="w-full sm:w-auto h-[10vw] sm:h-12 text-[3vw] sm:text-xs font-black uppercase tracking-widest rounded-xl border-primary/10 hover:bg-primary/5 text-muted-foreground"
            >
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[2vw] sm:gap-4">
            <div className="border-l-4 border-primary rounded-[4vw] sm:rounded-2xl px-[4vw] py-[3vw] sm:p-8 shadow-xl shadow-primary/5 relative overflow-hidden bg-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
              <p className="text-[2.8vw] sm:text-xs font-bold text-primary/60 uppercase tracking-[0.2em] mb-[0.5vw] relative z-10">Settlement Value</p>
              <div className="relative z-10">
                <p className="text-[10vw] sm:text-4xl font-black text-foreground tracking-tighter tabular-nums leading-none">
                  LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[2.2vw] sm:text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mt-[0.5vw]">Total Amount</p>
              </div>
            </div>
            <div className="bg-primary/5 border-2 border-primary/10 rounded-[4vw] sm:rounded-2xl px-[4vw] py-[3vw] sm:p-8 shadow-inner shadow-primary/5">
              <p className="text-[2.8vw] sm:text-xs font-bold text-primary/60 uppercase tracking-[0.2em] mb-[0.5vw]">Transaction Volume</p>
              <p className="text-[10vw] sm:text-4xl font-black text-foreground tracking-tighter tabular-nums leading-none">
                {totalCount.toLocaleString()}
              </p>
              <p className="text-[2.2vw] sm:text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mt-[0.5vw]">Verified History</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="px-[4vw] py-[3vw] sm:p-4 pb-0 sm:pb-4 border-b border-sidebar-border/20 flex flex-row justify-between">
          <div className="space-y-[1vw] sm:space-y-1">
            <CardTitle className="text-[5vw] sm:text-xl font-black tracking-tight text-primary uppercase">Performance Chart</CardTitle>
            <CardDescription className="text-[2.5vw] sm:text-xs uppercase tracking-widest font-bold opacity-40">
              {chartMode === 'monthly' ? 'Monthly Volume Analytics' :
               chartMode === 'yearly' ? 'Annual Strategic Performance' :
               'Daily Revenue Trends'}
            </CardDescription>
          </div>
          <Select value={chartMode} onValueChange={(v) => setChartMode(v as any)}>
            <SelectTrigger className="w-[30vw] sm:w-[120px] h-[8vw] sm:h-9 rounded-[2vw] sm:rounded-md text-[2.5vw] sm:text-xs font-bold bg-secondary/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily" disabled={statusCalculations.isDailyDisabled}>Daily</SelectItem>
              <SelectItem value="monthly" disabled={statusCalculations.isMonthlyDisabled}>Monthly</SelectItem>
              <SelectItem value="yearly" disabled={statusCalculations.isYearlyDisabled}>Yearly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0 sm:pt-0">
          <div className="h-[30vh] min-h-[220px] max-h-[350px] w-full sm:pt-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={200} debounce={50}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Value" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
