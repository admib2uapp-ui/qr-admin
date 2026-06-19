"use client";

interface Props {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  totalEvents: number;
}

export default function OverviewCards({ pageViews, uniqueVisitors, sessions, totalEvents }: Props) {
  const cards = [
    { label: "Page Views", value: pageViews.toLocaleString(), color: "text-blue-600" },
    { label: "Unique Visitors", value: uniqueVisitors.toLocaleString(), color: "text-emerald-600" },
    { label: "Sessions", value: sessions.toLocaleString(), color: "text-violet-600" },
    { label: "Total Events", value: totalEvents.toLocaleString(), color: "text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[2vw] sm:gap-3">
      {cards.map(c => (
        <div key={c.label} className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
          <p className="text-[2vw] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{c.label}</p>
          <p className={`text-[5vw] sm:text-2xl font-black mt-1 ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
