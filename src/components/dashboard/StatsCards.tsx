"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, QrCode, Banknote, CreditCard } from "lucide-react";

interface TagBreakdown {
  volume: number;
  count: number;
}

interface TodayStats {
  successTotal: number;
  count: number;
  breakdown: {
    QR: TagBreakdown;
    CASH: TagBreakdown;
    CREDIT: TagBreakdown;
  };
}

export function StatsCards() {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats({ successTotal: data.todayVolume, count: data.todayTransactions, breakdown: data.todayBreakdown });
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatLKR = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[6vw] sm:gap-6">
        {[1, 2].map(i => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
              <Skeleton className="h-8 w-32 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md mt-2" />
            </CardHeader>
            <CardContent className="p-[3vw] sm:p-4 pt-0">
              <Skeleton className="h-12 w-48 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[6vw] sm:gap-6">
      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-[3vw] sm:text-sm font-black text-muted-foreground uppercase tracking-widest">
                Today's Total
              </CardTitle>
              <CardDescription className="text-[2vw] sm:text-[10px] uppercase tracking-widest font-bold opacity-50">
                Successful Transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <p className="text-[8vw] sm:text-3xl font-black tracking-tighter tabular-nums text-primary">
            {stats ? formatLKR(stats.successTotal) : 'LKR 0.00'}
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-[3vw] sm:text-sm font-black text-muted-foreground uppercase tracking-widest">
                Transactions Count
              </CardTitle>
              <CardDescription className="text-[2vw] sm:text-[10px] uppercase tracking-widest font-bold opacity-50">
                Today's Successful
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-[3vw] sm:p-4 pt-0">
          <p className="text-[8vw] sm:text-3xl font-black tracking-tighter tabular-nums text-primary">
            {stats ? `${stats.count} transactions` : '0 transactions'}
          </p>
        </CardContent>
      </Card>
    </div>

    {stats?.breakdown && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[6vw] sm:gap-6 mt-[6vw] sm:mt-6">
        <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
          <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-[3vw] sm:text-sm font-black text-muted-foreground uppercase tracking-widest">QR</CardTitle>
                <CardDescription className="text-[2vw] sm:text-[10px] uppercase tracking-widest font-bold opacity-50">Transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-[3vw] sm:p-4 pt-0">
            <p className="text-[6vw] sm:text-2xl font-black tracking-tighter tabular-nums text-emerald-600">
              {formatLKR(stats.breakdown.QR.volume)}
            </p>
            <p className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
              {stats.breakdown.QR.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
          <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-[3vw] sm:text-sm font-black text-muted-foreground uppercase tracking-widest">CASH</CardTitle>
                <CardDescription className="text-[2vw] sm:text-[10px] uppercase tracking-widest font-bold opacity-50">Transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-[3vw] sm:p-4 pt-0">
            <p className="text-[6vw] sm:text-2xl font-black tracking-tighter tabular-nums text-amber-600">
              {formatLKR(stats.breakdown.CASH.volume)}
            </p>
            <p className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
              {stats.breakdown.CASH.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
          <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-[3vw] sm:text-sm font-black text-muted-foreground uppercase tracking-widest">CREDIT</CardTitle>
                <CardDescription className="text-[2vw] sm:text-[10px] uppercase tracking-widest font-bold opacity-50">Transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-[3vw] sm:p-4 pt-0">
            <p className="text-[6vw] sm:text-2xl font-black tracking-tighter tabular-nums text-blue-600">
              {formatLKR(stats.breakdown.CREDIT.volume)}
            </p>
            <p className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
              {stats.breakdown.CREDIT.count} transactions
            </p>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
}
