"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Mail } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface Viewer {
  email: string;
  distinct_id: string;
}

interface PageData {
  url: string;
  views: number;
  visitors: number;
  viewers: Viewer[];
}

interface Props {
  pages: PageData[];
}

export default function PagesTable({ pages }: Props) {
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
      <h3 className="text-[3vw] sm:text-sm font-black text-foreground uppercase tracking-tight mb-4">Top Pages</h3>
      <div className="rounded-xl border border-primary/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/10 sticky top-0">
            <TableRow className="border-primary/10 hover:bg-transparent">
              <TableHead className="w-6" />
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">#</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px]">Page URL</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-right">Views</TableHead>
              <TableHead className="font-black text-primary uppercase tracking-widest text-[10px] text-right">Visitors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No data</TableCell>
              </TableRow>
            ) : (
              pages.flatMap((p) => {
                const isExpanded = expandedUrl === p.url;
                return [
                  <TableRow key={p.url} className="border-primary/5 hover:bg-primary/5 transition-all cursor-pointer" onClick={() => setExpandedUrl(isExpanded ? null : p.url)}>
                    <TableCell className="text-xs text-muted-foreground">
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-bold">{pages.indexOf(p) + 1}</TableCell>
                    <TableCell className="text-xs font-medium truncate max-w-[250px]">{p.url || "/"}</TableCell>
                    <TableCell className="text-xs font-bold text-right">{p.views}</TableCell>
                    <TableCell className="text-xs text-muted-foreground text-right">{p.visitors}</TableCell>
                  </TableRow>,
                  ...(isExpanded ? [
                    <TableRow key={`${p.url}-expanded`}>
                      <TableCell colSpan={5} className="p-0">
                        <div className="bg-primary/5 border-t border-primary/10">
                          {p.viewers.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-6 py-3">No viewer data</p>
                          ) : (
                            p.viewers.map((v, vi) => (
                              <div key={vi} className="flex items-center gap-3 px-6 py-2 text-xs border-b border-primary/5 last:border-0">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="font-medium">{v.email}</span>
                                <span className="text-muted-foreground font-mono text-[10px]">{v.distinct_id.slice(0, 16)}...</span>
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ] : []),
                ];
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
