"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ChevronDown, ChevronUp, Send, LifeBuoy, MessageSquare, Receipt, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Ticket {
  id: string;
  ticket_type: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
  transaction_id: string | null;
  merchant_id: string;
  merchant_name: string;
  merchant_id_str: string;
  message_count: number;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'merchant' | 'admin';
  message: string;
  created_at: string;
}

const TICKET_TYPE_META: Record<string, { icon: string; label: string }> = {
  dispute: { icon: "⚠️", label: "Dispute" },
  technical: { icon: "🔧", label: "Technical" },
  other: { icon: "💬", label: "Other" },
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed: "bg-muted/10 text-muted-foreground border-muted/20",
};

function formatDate(iso: string) {
  return format(new Date(iso), 'MMM dd, HH:mm');
}

export function MobileHelpdesk() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transaction, setTransaction] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const res = await apiFetch(`/api/helpdesk/tickets${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchDetail = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const res = await apiFetch(`/api/helpdesk/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTransaction(data.transaction || null);
        setNewStatus(data.ticket.status);
      }
    } catch {
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (ticket: Ticket) => {
    setDetailTicket(ticket);
    setMessages([]);
    setTransaction(null);
    setReplyText("");
    await fetchDetail(ticket.id);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !detailTicket) return;
    setSendingReply(true);
    try {
      const res = await apiFetch(`/api/helpdesk/tickets/${detailTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        await fetchDetail(detailTicket.id);
        await fetchTickets();
      }
    } catch {
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!detailTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await apiFetch(`/api/helpdesk/tickets/${detailTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setNewStatus(status);
        await fetchDetail(detailTicket.id);
        await fetchTickets();
      }
    } catch {
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tickets.length };
    tickets.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return counts;
  }, [tickets]);

  const tabs = [
    { key: "ALL", label: "All" },
    { key: "open", label: "Open" },
    { key: "resolved", label: "Resolved" },
    { key: "closed", label: "Closed" },
  ];

  // Detail view
  if (detailTicket) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <button onClick={() => { setDetailTicket(null); setMessages([]); setTransaction(null); }} className="p-2 -ml-2 hover:bg-primary/5 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm tracking-tight truncate">
              {TICKET_TYPE_META[detailTicket.ticket_type]?.label || "Other"} Ticket
            </p>
            <p className="text-xs text-muted-foreground">{detailTicket.merchant_name}</p>
          </div>
          <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-2 ${STATUS_STYLES[detailTicket.status] || STATUS_STYLES.open}`}>
            {detailTicket.status}
          </Badge>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-bold text-muted-foreground animate-pulse">Loading ticket...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Original Message */}
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🧑‍💼</span>
                <span className="text-[11px] font-black text-foreground">Merchant</span>
                <span className="text-[9px] font-bold text-muted-foreground">{formatDate(detailTicket.created_at)}</span>
              </div>
              <p className="text-sm font-medium whitespace-pre-wrap">{detailTicket.reason}</p>
            </div>

            {/* Transaction Details */}
            {transaction && (
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Transaction</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Reference</p>
                    <p className="text-xs font-bold font-mono">{transaction.reference_no || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Amount</p>
                    <p className="text-xs font-bold">Rs.{Number(transaction.amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                    <Badge variant="outline" className={`rounded-full px-2 py-0 font-black text-[9px] uppercase tracking-widest border-2 ${
                      transaction.source_table === 'completed_transactions'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : transaction.source_table === 'cancelled_transactions'
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      {transaction.source_table === 'completed_transactions' ? 'Success'
                        : transaction.source_table === 'cancelled_transactions' ? 'Cancelled'
                        : transaction.status || 'Pending'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Date</p>
                    <p className="text-xs font-bold">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender_role === 'admin' ? '' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-1 ${
                  msg.sender_role === 'admin' ? 'bg-primary/20' : 'bg-amber-500/20'
                }`}>
                  {msg.sender_role === 'admin' ? '🛡️' : '🧑‍💼'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black text-foreground">
                      {msg.sender_role === 'admin' ? 'Admin' : 'Merchant'}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <div className={`rounded-xl p-3 border ${
                    msg.sender_role === 'admin'
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-primary/5 border-primary/10'
                  }`}>
                    <p className="text-sm font-medium whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Status Update */}
            <div className="pt-3 border-t border-primary/10">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Status</label>
              <div className="flex items-center gap-2">
                <Select value={newStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="flex-1 h-10 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                {updatingStatus && <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
              </div>
            </div>

            {/* Reply */}
            {detailTicket.status !== 'resolved' && detailTicket.status !== 'closed' && (
              <div className="pt-3 border-t border-primary/10">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Reply</label>
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="flex-1 rounded-xl bg-primary/5 border-2 border-primary/10 text-sm font-medium px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none placeholder:text-muted-foreground/40"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                  <Button
                    onClick={handleReply}
                    disabled={!replyText.trim() || sendingReply}
                    className="h-auto px-4 rounded-xl font-black uppercase tracking-widest text-xs"
                  >
                    {sendingReply ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Ticket list view
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{tickets.length} tickets</p>
        <Button onClick={fetchTickets} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-primary/5 text-muted-foreground border-primary/10'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-60">({statusCounts[tab.key] || 0})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-primary/5 rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-medium">
            No tickets found
          </div>
        ) : (
          tickets.map(t => {
            const meta = TICKET_TYPE_META[t.ticket_type] || TICKET_TYPE_META.other;
            return (
              <div
                key={t.id}
                onClick={() => openDetail(t)}
                className="bg-primary/5 rounded-xl p-4 border border-primary/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-bold text-sm truncate">{t.reason}</p>
                    <p className="text-xs text-muted-foreground">{t.merchant_name}</p>
                  </div>
                  <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-2 shrink-0 ${STATUS_STYLES[t.status] || STATUS_STYLES.open}`}>
                    {t.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span>{meta.icon} {meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {t.message_count}
                    </span>
                    <span>{formatDate(t.created_at)}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
