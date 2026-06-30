"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Transaction {
  id: string;
  reference_no: string;
  amount: number;
  tag: string | null;
  status: string;
  created_at: string;
}

interface Props {
  transactions: Transaction[];
  merchantName: string;
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  CREDIT: "Credit",
};

export default function MerchantTransactions({ transactions, merchantName }: Props) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[3vw] sm:text-sm font-black text-foreground uppercase tracking-tight">Recent Transactions</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/transactions?search=${encodeURIComponent(merchantName)}`)}
          className="text-xs font-black uppercase tracking-widest text-primary"
        >
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
      ) : (
        <div className="rounded-xl border border-primary/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow className="border-primary/10 hover:bg-transparent">
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Reference</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-right">Amount</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Method</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(t => (
                <TableRow key={t.id} className="border-primary/5 hover:bg-primary/5 transition-all">
                  <TableCell className="text-xs font-mono font-medium">{t.reference_no}</TableCell>
                  <TableCell className="text-xs font-bold text-right">LKR {t.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{methodLabels[t.tag || ""] || "QR"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-full px-2 py-0.5 font-black text-[9px] uppercase tracking-widest border-2 ${statusColors[t.status] || "bg-primary/10 text-primary border-primary/20"}`}>
                      {t.status === "completed" || t.status === "success" ? "Success" : t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("en-LK")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
