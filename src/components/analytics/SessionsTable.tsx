"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface Session {
  time: string;
  email: string;
  ip: string;
  browser: string;
  os: string;
  location: string;
  url: string;
}

interface Props {
  sessions: Session[];
}

export default function SessionsTable({ sessions }: Props) {
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
      <h3 className="text-[3vw] sm:text-sm font-black text-foreground uppercase tracking-tight mb-4">Recent Sessions</h3>
      <div className="rounded-xl border border-primary/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/10 sticky top-0">
            <TableRow className="border-primary/10 hover:bg-transparent">
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Time</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">User</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">IP</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Browser</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">OS</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Location</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Page</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s, i) => (
              <TableRow key={i} className="border-primary/5 hover:bg-primary/5 transition-all">
                <TableCell className="text-[2.5vw] sm:text-xs whitespace-nowrap">{s.time}</TableCell>
                <TableCell className="text-xs font-medium">{s.email || s.ip || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{s.ip || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.browser || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.os || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.location || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">{s.url || "-"}</TableCell>
              </TableRow>
            ))}
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No session data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
