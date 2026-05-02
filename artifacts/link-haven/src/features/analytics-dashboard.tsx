import { BarChart3, TrendingUp, Globe, Hash, Bookmark, Star, Archive, Clock, Calendar, Zap, Pin } from "lucide-react";

interface Bookmark {
  id: number;
  title: string;
  url: string;
  domain?: string;
  type?: string;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  createdAt: string;
}

interface AnalyticsDashboardProps {
  bookmarks: Bookmark[];
}

function StatCard({ icon, label, value, sub, color = "indigo" }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-600/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400",
    violet: "from-violet-600/20 to-violet-600/5 border-violet-500/20 text-violet-400",
    emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400",
    rose: "from-rose-600/20 to-rose-600/5 border-rose-500/20 text-rose-400",
    cyan: "from-cyan-600/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colors[color]} border p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{label}</span>
        <div className="opacity-70">{icon}</div>
      </div>
      <span className="text-3xl font-bold text-white">{value}</span>
      {sub && <span className="text-[11px] text-white/30">{sub}</span>}
    </div>
  );
}

function BarRow({ label, value, max, color = "#6366f1" }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-white/50 w-28 truncate shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] text-white/35 tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

export function AnalyticsDashboard({ bookmarks }: AnalyticsDashboardProps) {
  const total = bookmarks.length;
  const favs = bookmarks.filter(b => b.isFavorite).length;
  const archived = bookmarks.filter(b => b.isArchived).length;
  const pinned = bookmarks.filter(b => b.isPinned).length;
  const withNotes = bookmarks.filter((b: any) => b.note).length;
  const tagged = bookmarks.filter(b => b.tags && b.tags.length > 0).length;

  // Domain frequency
  const domainMap: Record<string, number> = {};
  bookmarks.forEach(b => {
    if (b.domain) domainMap[b.domain] = (domainMap[b.domain] || 0) + 1;
  });
  const topDomains = Object.entries(domainMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Tag frequency
  const tagMap: Record<string, number> = {};
  bookmarks.forEach(b => b.tags?.forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; }));
  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Type distribution
  const typeMap: Record<string, number> = {};
  bookmarks.forEach(b => {
    const t = b.type || "link";
    typeMap[t] = (typeMap[t] || 0) + 1;
  });
  const types = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

  // Bookmarks per day (last 30 days)
  const now = new Date();
  const dayBuckets: number[] = Array(30).fill(0);
  bookmarks.forEach(b => {
    const d = Math.floor((now.getTime() - new Date(b.createdAt).getTime()) / 86400000);
    if (d >= 0 && d < 30) dayBuckets[d]++;
  });
  const recentTotal = dayBuckets.reduce((a, b) => a + b, 0);
  const maxDay = Math.max(...dayBuckets, 1);

  // Weekly activity
  const weeks: number[] = Array(8).fill(0);
  bookmarks.forEach(b => {
    const w = Math.floor((now.getTime() - new Date(b.createdAt).getTime()) / (7 * 86400000));
    if (w >= 0 && w < 8) weeks[w]++;
  });
  const maxWeek = Math.max(...weeks, 1);

  const domainColors = ["#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b","#ef4444","#06b6d4","#84cc16"];

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<Bookmark className="size-4" />} label="Total" value={total} color="indigo" />
        <StatCard icon={<Star className="size-4" />} label="Favorites" value={favs} sub={`${total > 0 ? Math.round(favs/total*100) : 0}% of total`} color="amber" />
        <StatCard icon={<Archive className="size-4" />} label="Archived" value={archived} color="violet" />
        <StatCard icon={<Pin className="size-4" />} label="Pinned" value={pinned} color="cyan" />
        <StatCard icon={<Hash className="size-4" />} label="Tagged" value={tagged} sub={`${total > 0 ? Math.round(tagged/total*100) : 0}% have tags`} color="emerald" />
        <StatCard icon={<TrendingUp className="size-4" />} label="Last 30d" value={recentTotal} color="rose" />
      </div>

      {/* Activity chart */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="size-4 text-indigo-400" />
          <h3 className="text-[13px] font-semibold text-white/80">Daily Activity (Last 30 Days)</h3>
          <span className="ml-auto text-[11px] text-white/30">{recentTotal} saved</span>
        </div>
        <div className="flex items-end gap-0.5 h-20">
          {dayBuckets.reverse().map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all hover:opacity-100 opacity-80 group relative"
              style={{
                height: `${(v / maxDay) * 100}%`,
                minHeight: v > 0 ? "3px" : "1px",
                background: v > 0 ? "#6366f1" : "#ffffff08",
              }}
            >
              {v > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-[#1a1a2e] border border-white/10 rounded px-1 py-0.5 text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {v}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-white/20">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Top Domains */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="size-3.5 text-indigo-400" />
            <h3 className="text-[13px] font-semibold text-white/80">Top Domains</h3>
          </div>
          <div className="space-y-2.5">
            {topDomains.length > 0 ? topDomains.map(([domain, count], i) => (
              <BarRow key={domain} label={domain} value={count} max={topDomains[0][1]} color={domainColors[i % domainColors.length]} />
            )) : <p className="text-[12px] text-white/25 text-center py-4">No data yet</p>}
          </div>
        </div>

        {/* Top Tags */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="size-3.5 text-indigo-400" />
            <h3 className="text-[13px] font-semibold text-white/80">Top Tags</h3>
          </div>
          <div className="space-y-2.5">
            {topTags.length > 0 ? topTags.map(([tag, count], i) => (
              <BarRow key={tag} label={`#${tag}`} value={count} max={topTags[0][1]} color={domainColors[i % domainColors.length]} />
            )) : <p className="text-[12px] text-white/25 text-center py-4">No tags yet</p>}
          </div>
        </div>

        {/* Type distribution */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="size-3.5 text-indigo-400" />
            <h3 className="text-[13px] font-semibold text-white/80">Content Types</h3>
          </div>
          <div className="space-y-2.5">
            {types.map(([type, count], i) => (
              <BarRow key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} value={count} max={types[0][1]} color={domainColors[i % domainColors.length]} />
            ))}
          </div>

          {/* Weekly trend */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/30 mb-2">Weekly saves (last 8 weeks)</p>
            <div className="flex items-end gap-1 h-10">
              {weeks.reverse().map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${(v / maxWeek) * 100}%`,
                    minHeight: v > 0 ? "2px" : "1px",
                    background: i === 7 ? "#6366f1" : `rgba(99,102,241,${0.2 + (i/7)*0.4})`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
