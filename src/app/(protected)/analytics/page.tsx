"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, BarChart3 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import OverviewCards from "@/components/analytics/OverviewCards";
import PageViewsChart from "@/components/analytics/PageViewsChart";
import EventsTable from "@/components/analytics/EventsTable";
import PagesTable from "@/components/analytics/PagesTable";
import SessionsTable from "@/components/analytics/SessionsTable";

type Tab = "overview" | "events" | "pages" | "sessions";

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pageViews, setPageViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [chartData, setChartData] = useState<{ day: string; views: number }[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pages, setPages] = useState<{ url: string; views: number; visitors: number; viewers: { email: string; distinct_id: string }[] }[]>([]);
  const [sessionList, setSessionList] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, chartRes, pagesRes, viewersRes, eventsRes] = await Promise.all([
        apiFetch('/api/posthog/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT count() as total_events, count(DISTINCT person_id) as visitors, count(DISTINCT properties.$session_id) as sessions_count FROM events WHERE timestamp >= now() - INTERVAL ${days} DAY`,
          }),
        }),
        apiFetch('/api/posthog/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT toDate(timestamp) as day, count() as views FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY GROUP BY day ORDER BY day`,
          }),
        }),
        apiFetch('/api/posthog/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT properties.$current_url as url, count() as views, count(DISTINCT person_id) as visitors FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY GROUP BY url ORDER BY views DESC LIMIT 20`,
          }),
        }),
        apiFetch('/api/posthog/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT e.properties.$current_url, e.distinct_id, p.properties['email'] FROM events e LEFT JOIN persons p ON p.id = e.person_id WHERE e.event='$pageview' AND e.timestamp >= now() - INTERVAL ${days} DAY GROUP BY e.properties.$current_url, e.distinct_id, p.properties['email']`,
          }),
        }),
        apiFetch('/api/posthog/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT e.event, e.properties, e.timestamp, e.distinct_id, p.properties['email'] FROM events e LEFT JOIN persons p ON p.id = e.person_id WHERE e.timestamp >= now() - INTERVAL ${days} DAY ORDER BY e.timestamp DESC LIMIT 300`,
          }),
        }),
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        const row = stats.results?.[0] || [];
        setTotalEvents(Number(row[0]) || 0);
        setUniqueVisitors(Number(row[1]) || 0);
        setSessions(Number(row[2]) || 0);
      }

      if (chartRes.ok) {
        const chart = await chartRes.json();
        const rows = chart.results || [];
        const totalViews = rows.reduce((s: number, r: any[]) => s + Number(r[1] || 0), 0);
        setPageViews(totalViews);
        setChartData(rows.map((r: any[]) => ({ day: r[0], views: Number(r[1] || 0) })));
      } else {
        setPageViews(0);
        setChartData([]);
      }

      const viewersByUrl: Record<string, { email: string; distinct_id: string }[]> = {};
      if (viewersRes.ok) {
        const v = await viewersRes.json();
        (v.results || []).forEach((r: any[]) => {
          const url = r[0] || "/";
          if (!viewersByUrl[url]) viewersByUrl[url] = [];
          viewersByUrl[url].push({ distinct_id: r[1], email: r[2] || r[1] });
        });
      }

      if (pagesRes.ok) {
        const p = await pagesRes.json();
        setPages((p.results || []).map((r: any[]) => ({
          url: r[0] || "/",
          views: Number(r[1] || 0),
          visitors: Number(r[2] || 0),
          viewers: viewersByUrl[r[0] || "/"] || [],
        })));
      } else {
        setPages([]);
      }

      if (eventsRes.ok) {
        const ev = await eventsRes.json();
        const rows = ev.results || [];
        const parsed = rows.map((r: any[]) => {
          let props: Record<string, any> = {};
          try { props = typeof r[1] === 'string' ? JSON.parse(r[1]) : (r[1] || {}); } catch {}
          return {
            id: crypto.randomUUID(),
            event: r[0],
            properties: props,
            timestamp: r[2],
            distinct_id: r[3],
            person_email: r[4] || null,
          };
        });

        setEvents(parsed);
        setSessionList(parsed
          .filter((e: any) => e.event === '$pageview')
          .slice(0, 100)
          .map((e: any) => ({
            time: new Date(e.timestamp).toLocaleString("en-LK"),
            email: e.person_email || e.distinct_id || "",
            ip: e.properties?.$ip || "",
            browser: `${e.properties?.$browser || ""}${e.properties?.$browser_version ? " " + e.properties.$browser_version : ""}`,
            os: `${e.properties?.$os || ""}${e.properties?.$os_version ? " " + e.properties.$os_version : ""}`,
            location: [e.properties?.$geoip_city_name, e.properties?.$geoip_country_name].filter(Boolean).join(", "),
            url: e.properties?.$current_url || "",
          }))
        );
      } else {
        setEvents([]);
        setSessionList([]);
      }
    } catch {
      setError("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "events", label: "Events" },
    { key: "pages", label: "Pages" },
    { key: "sessions", label: "Sessions" },
  ];

  return (
    <div className="space-y-[4vw] sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-[5vw] sm:text-2xl font-black text-foreground tracking-tight uppercase">Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[100px] h-10 border-primary/10 bg-primary/5 rounded-xl text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline" size="sm" className="h-10 rounded-xl text-xs font-black uppercase tracking-widest" disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-primary/10 bg-primary/5 p-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}

      {tab === "overview" && (
        <div className="space-y-[4vw] sm:space-y-4">
          <OverviewCards pageViews={pageViews} uniqueVisitors={uniqueVisitors} sessions={sessions} totalEvents={totalEvents} />
          <PageViewsChart data={chartData} />
        </div>
      )}

      {tab === "events" && <EventsTable events={events} />}

      {tab === "pages" && <PagesTable pages={pages} />}

      {tab === "sessions" && <SessionsTable sessions={sessionList} />}
    </div>
  );
}
