"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props {
  data: { day: string; views: number }[];
}

export default function PageViewsChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-[3vw] sm:p-4 shadow-lg shadow-primary/5">
      <h3 className="text-[3vw] sm:text-sm font-black text-foreground uppercase tracking-tight mb-4">Page Views</h3>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No data</p>
      ) : (
        <div className="min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(v) => new Date(v).toLocaleDateString("en-LK")}
              />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
