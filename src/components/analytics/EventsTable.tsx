"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PostHogEvent {
  id: string;
  event: string;
  timestamp: string;
  distinct_id: string;
  properties: Record<string, any>;
  person_email?: string | null;
}

interface Props {
  events: PostHogEvent[];
}

const eventColors: Record<string, string> = {
  $pageview: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  $pageleave: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  payment_completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  qr_generated: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  cash_recorded: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  credit_recorded: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  auth_exchanged: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

export default function EventsTable({ events }: Props) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const eventTypes = [...new Set(events.map(e => e.event))];

  const filtered = events.filter(e => {
    if (filter !== "ALL" && e.event !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const props = JSON.stringify(e.properties).toLowerCase();
      return (
        e.event.toLowerCase().includes(q) ||
        e.properties.$current_url?.toLowerCase().includes(q) ||
        e.properties.$ip?.toLowerCase().includes(q) ||
        e.person_email?.toLowerCase().includes(q) ||
        e.distinct_id?.toLowerCase().includes(q) ||
        props.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Event Type</label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] h-10 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Events</SelectItem>
              {eventTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Search</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="URL, IP, email..."
            className="h-10 w-full rounded-xl border border-primary/10 bg-primary/5 px-3 text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground font-medium">{filtered.length} events</p>
      </div>
      <div className="rounded-xl border border-primary/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/10 sticky top-0">
            <TableRow className="border-primary/10 hover:bg-transparent">
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Time</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Event</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">User</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">IP</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">URL / Properties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(e => (
              <TableRow key={e.id} className="border-primary/5 hover:bg-primary/5 transition-all cursor-default">
                <TableCell className="text-[2.5vw] sm:text-xs whitespace-nowrap">
                  {new Date(e.timestamp).toLocaleString("en-LK")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-full px-2 py-0.5 font-black text-[9px] uppercase tracking-widest border-2 ${eventColors[e.event] || "bg-primary/10 text-primary border-primary/20"}`}>
                    {e.event}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium">{e.person_email || e.distinct_id?.slice(0, 24) || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{e.properties?.$ip || "-"}</TableCell>
                <TableCell className="text-[2.5vw] sm:text-xs text-muted-foreground max-w-[200px] truncate">
                  {e.event === "$pageview" || e.event === "$pageleave"
                    ? e.properties?.$current_url || "-"
                    : Object.entries(e.properties || {})
                        .filter(([k]) => !k.startsWith("$"))
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ") || "-"}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No events found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
