"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ChevronDown, ChevronUp, Send, LifeBuoy, MessageSquare, Receipt } from "lucide-react";
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
  open: "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-amber-500/10 text-amber-600 border-amber-500/20",
  resolved: "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed: "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-2 bg-muted/10 text-muted-foreground border-muted/20",
};

function formatDate(iso: string) {
  return format(new Date(iso), 'MMM dd, HH:mm');
}

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
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
        setSelectedTicket(data.ticket);
        setMessages(data.messages || []);
        setTransaction(data.transaction || null);
        setNewStatus(data.ticket.status);
      }
    } catch {
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRowClick = async (ticketId: string) => {
    if (expandedId === ticketId) {
      setExpandedId(null);
      setSelectedTicket(null);
      setMessages([]);
      setTransaction(null);
      return;
    }
    setExpandedId(ticketId);
    await fetchDetail(ticketId);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !expandedId) return;
    setSendingReply(true);
    try {
      const res = await apiFetch(`/api/helpdesk/tickets/${expandedId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        await fetchDetail(expandedId);
        await fetchTickets();
      }
    } catch {
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!expandedId) return;
    setUpdatingStatus(true);
    try {
      const res = await apiFetch(`/api/helpdesk/tickets/${expandedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setNewStatus(status);
        await fetchDetail(expandedId);
        await fetchTickets();
      }
    } catch {
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tickets.length };
    tickets.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tickets]);

  const tabs = [
    { key: "ALL", label: "All" },
    { key: "open", label: "Open" },
    { key: "resolved", label: "Resolved" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div className="space-y-[6vw] sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Helpdesk</h1>
          <p className="text-[2.5vw] sm:text-sm text-muted-foreground font-medium">Manage support tickets</p>
        </div>
        <Button onClick={fetchTickets} variant="outline" size="sm" className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-[2vw] sm:gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setExpandedId(null); setSelectedTicket(null); setMessages([]); setTransaction(null); }}
            className={`px-[4vw] sm:px-5 py-[2vw] sm:py-2.5 rounded-[3vw] sm:rounded-xl font-black text-[2.8vw] sm:text-[10px] uppercase tracking-widest border-2 transition-all ${
              statusFilter === tab.key
                ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10"
                : "bg-primary/5 border-primary/10 text-muted-foreground hover:bg-primary/10 hover:border-primary/30"
            }`}
          >
            {tab.label}
            <span className="ml-[2vw] sm:ml-2 text-[2.5vw] sm:text-[10px] opacity-60">({statusCounts[tab.key] || 0})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[6vw] sm:gap-6">
        {/* Ticket List */}
        <div className="xl:col-span-2">
          <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
            <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3">
              <div className="flex items-center gap-[3vw] sm:gap-3">
                <div className="p-[2vw] sm:p-2 rounded-[2vw] sm:rounded-lg bg-primary/10">
                  <LifeBuoy className="w-[4vw] h-[4vw] sm:w-4 sm:h-4 text-primary" />
                </div>
                <CardTitle className="text-[4vw] sm:text-lg font-black tracking-tight">
                  Tickets
                  <span className="text-[2vw] sm:text-xs font-bold text-muted-foreground ml-2">({tickets.length})</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-[3vw] sm:p-4 pt-0">
              <div className="rounded-xl border border-primary/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-primary/10">
                    <TableRow className="border-primary/10 hover:bg-transparent">
                      <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Issue</TableHead>
                      <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Merchant</TableHead>
                      <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Type</TableHead>
                      <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Status</TableHead>
                      <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-center">Replies</TableHead>
                      <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i} className="border-primary/5">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map(t => {
                        const meta = TICKET_TYPE_META[t.ticket_type] || TICKET_TYPE_META.other;
                        const expanded = expandedId === t.id;
                        return (
                          <TableRow
                            key={t.id}
                            className={`border-primary/5 transition-all cursor-pointer ${
                              expanded ? 'bg-primary/10' : 'hover:bg-primary/5'
                            }`}
                            onClick={() => handleRowClick(t.id)}
                          >
                            <TableCell className="font-bold max-w-[200px]">
                              <div className="flex items-center gap-[2vw] sm:gap-2">
                                <span className="truncate">{t.reason}</span>
                                {expanded ? (
                                  <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs font-medium">
                              {t.merchant_name}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">{meta.icon} {meta.label}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={STATUS_STYLES[t.status] || STATUS_STYLES.open}>
                                {t.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center gap-1 text-xs font-bold text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                {t.message_count}
                              </span>
                            </TableCell>
                            <TableCell className="text-[2.5vw] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">
                              {formatDate(t.created_at)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Detail Panel */}
        <div className="xl:col-span-1">
          {!expandedId ? (
            <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5 h-full">
              <CardContent className="p-[6vw] sm:p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="p-[4vw] sm:p-4 rounded-full bg-primary/5 mb-[3vw] sm:mb-4">
                  <LifeBuoy className="w-[8vw] h-[8vw] sm:w-10 sm:h-10 text-muted-foreground/30" />
                </div>
                <p className="text-[3vw] sm:text-sm font-bold text-muted-foreground/50">
                  Select a ticket to view details
                </p>
              </CardContent>
            </Card>
          ) : detailLoading ? (
            <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5 h-full">
              <CardContent className="p-[6vw] sm:p-8 flex items-center justify-center h-full min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading ticket...</p>
                </div>
              </CardContent>
            </Card>
          ) : selectedTicket ? (
            <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5 h-full flex flex-col">
              <CardHeader className="p-[3vw] sm:p-4 pb-[1.5vw] sm:pb-3 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[2vw] sm:gap-2">
                    <span className="text-lg">
                      {TICKET_TYPE_META[selectedTicket.ticket_type]?.icon || "💬"}
                    </span>
                    <div>
                      <p className="text-[3vw] sm:text-sm font-black tracking-tight">
                        {TICKET_TYPE_META[selectedTicket.ticket_type]?.label || "Other"}
                      </p>
                      <p className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground">
                        {selectedTicket.merchant_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[selectedTicket.status] || STATUS_STYLES.open}>
                    {selectedTicket.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-[3vw] sm:p-4 flex-1 overflow-y-auto space-y-[3vw] sm:space-y-4">
                {/* Initial Merchant Message */}
                <div className="flex gap-[2vw] sm:gap-3">
                  <div className="w-[6vw] h-[6vw] sm:w-8 sm:h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-[3vw] sm:text-sm shrink-0 mt-1">
                    🧑‍💼
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[2.5vw] sm:text-[11px] font-black text-foreground">Merchant</span>
                      <span className="text-[2vw] sm:text-[9px] font-bold text-muted-foreground">
                        {formatDate(selectedTicket.created_at)}
                      </span>
                    </div>
                    <div className="bg-primary/5 rounded-[2vw] sm:rounded-xl p-[3vw] sm:p-3 border border-primary/10">
                      <p className="text-[3vw] sm:text-sm font-medium whitespace-pre-wrap">{selectedTicket.reason}</p>
                    </div>

                  </div>
                </div>

                {/* Transaction Details */}
                {transaction && (
                  <div className="bg-primary/5 rounded-[2vw] sm:rounded-xl p-[3vw] sm:p-4 border border-primary/10 space-y-[2vw] sm:space-y-3">
                    <div className="flex items-center gap-[2vw] sm:gap-2">
                      <Receipt className="w-[4vw] h-[4vw] sm:w-4 sm:h-4 text-primary" />
                      <span className="text-[2.5vw] sm:text-[10px] font-black text-primary uppercase tracking-widest">Transaction Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-[2vw] sm:gap-3">
                      <div>
                        <p className="text-[2vw] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Reference</p>
                        <p className="text-[2.8vw] sm:text-xs font-bold text-foreground font-mono">{transaction.reference_no || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[2vw] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Amount</p>
                        <p className="text-[2.8vw] sm:text-xs font-bold text-foreground">Rs.{Number(transaction.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[2vw] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                        <Badge variant="outline" className={`rounded-full px-2 py-0 font-black text-[2vw] sm:text-[9px] uppercase tracking-widest border-2 ${
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
                        <p className="text-[2vw] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Date</p>
                        <p className="text-[2.8vw] sm:text-xs font-bold text-foreground">{formatDate(transaction.created_at)}</p>
                      </div>
                      {transaction.invoice_no && (
                        <div>
                          <p className="text-[2vw] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Invoice</p>
                          <p className="text-[2.8vw] sm:text-xs font-bold text-foreground">{transaction.invoice_no}</p>
                        </div>
                      )}
                      {(transaction.tag || transaction.source_table === 'completed_transactions') && (
                        <div>
                          <p className="text-[2vw] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Method</p>
                          <p className="text-[2.8vw] sm:text-xs font-bold text-foreground">{transaction.tag || 'QR'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Replies */}
                {messages.map(msg => (
                  <div key={msg.id} className="flex gap-[2vw] sm:gap-3">
                    <div className={`w-[6vw] h-[6vw] sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[3vw] sm:text-sm shrink-0 mt-1 ${
                      msg.sender_role === 'admin' ? 'bg-primary/20' : 'bg-amber-500/20'
                    }`}>
                      {msg.sender_role === 'admin' ? '🛡️' : '🧑‍💼'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[2.5vw] sm:text-[11px] font-black text-foreground">
                          {msg.sender_role === 'admin' ? 'Admin' : 'Merchant'}
                        </span>
                        <span className="text-[2vw] sm:text-[9px] font-bold text-muted-foreground">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <div className={`rounded-[2vw] sm:rounded-xl p-[3vw] sm:p-3 border ${
                        msg.sender_role === 'admin'
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-primary/5 border-primary/10'
                      }`}>
                        <p className="text-[3vw] sm:text-sm font-medium whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Status Update */}
                <div className="pt-[2vw] sm:pt-3 border-t border-primary/10">
                  <label className="text-[2.5vw] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-[1vw] sm:mb-2">
                    Status
                  </label>
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
                    {updatingStatus && (
                      <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                <div className="pt-[2vw] sm:pt-3 border-t border-primary/10">
                  <label className="text-[2.5vw] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-[1vw] sm:mb-2">
                    Reply
                  </label>
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
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
