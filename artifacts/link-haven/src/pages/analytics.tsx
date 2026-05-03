import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AppLayout } from "@/components/layout/app-layout";
import { useListBookmarks, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { AnalyticsDashboard } from "@/features/analytics-dashboard";
import { TagCloud } from "@/features/tag-cloud";
import { RecentActivity } from "@/features/recent-activity";
import { useLocation } from "wouter";
import {
  BarChart3, Sparkles, TrendingUp, Zap, Globe,
  Activity, Database, Brain, Star,
} from "lucide-react";

/* ─── Animated background grid ─────────────────────────────── */
const PAGE_CSS = `
@keyframes _pg-orb-a { 0%,100%{transform:translate(0,0)scale(1);opacity:.18} 50%{transform:translate(80px,-60px)scale(1.3);opacity:.32} }
@keyframes _pg-orb-b { 0%,100%{transform:translate(0,0)scale(1);opacity:.14} 40%{transform:translate(-60px,70px)scale(.8);opacity:.28} }
@keyframes _pg-orb-c { 0%,100%{transform:translate(0,0)scale(1)} 60%{transform:translate(40px,-40px)scale(1.2);opacity:.22} }
@keyframes _pg-scan  { 0%{top:-2px} 100%{top:100%} }
@keyframes _pg-hdr-in { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:translateY(0)} }
@keyframes _pg-shimmer { 0%{background-position:-400% center} 100%{background-position:400% center} }
@keyframes _pg-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
@keyframes _pg-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes _pg-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes _pg-particle { 0%{transform:translate(0,0);opacity:0} 15%{opacity:.7} 85%{opacity:.4} 100%{transform:translate(var(--x),var(--y));opacity:0} }
@keyframes _pg-badge-in { 0%{opacity:0;transform:translateX(-12px)} 100%{opacity:1;transform:translateX(0)} }

._pg-title {
  background: linear-gradient(120deg, #e0e7ff, #c4b5fd, #818cf8, #38bdf8, #e0e7ff);
  background-size: 400% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: _pg-shimmer 5s linear infinite;
}
._pg-hdr-in { animation: _pg-hdr-in .45s cubic-bezier(.22,1,.36,1) both; }
._pg-orb-a  { animation: _pg-orb-a  22s ease-in-out infinite; }
._pg-orb-b  { animation: _pg-orb-b  17s ease-in-out infinite; }
._pg-orb-c  { animation: _pg-orb-c  13s ease-in-out infinite; }
._pg-pulse  { animation: _pg-pulse  2.8s ease-in-out infinite; }
._pg-spin   { animation: _pg-spin   18s linear infinite; }
._pg-float  { animation: _pg-float  3.5s ease-in-out infinite; }
._pg-scan::before {
  content:''; position:absolute; left:0; right:0; height:1px;
  background: linear-gradient(90deg,transparent,rgba(99,102,241,.5),rgba(139,92,246,.4),transparent);
  animation: _pg-scan 3s linear infinite;
}
`;

/* ─── Header particles ─────────────────────────────────────── */
function HeaderParticles() {
  const pts = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i / 17) * 90}%`,
    top: `${10 + Math.sin(i * 0.9) * 60}%`,
    size: 1.5 + (i % 3) * 1.2,
    color: ["#6366f1","#8b5cf6","#06b6d4","#ec4899","#10b981"][i % 5],
    dur: 5 + (i % 5) * 1.5,
    delay: i * 0.4,
    dx: ((i % 3) - 1) * 50,
    dy: -(20 + (i % 4) * 20),
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pts.map(p => (
        <div key={p.id} className="absolute rounded-full"
          style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            backgroundColor: p.color + "cc",
            boxShadow: `0 0 ${p.size * 4}px ${p.color}88`,
            animation: `_pg-particle ${p.dur}s ${p.delay}s ease-in-out infinite`,
            ["--x" as any]: `${p.dx}px`,
            ["--y" as any]: `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Stat badge ────────────────────────────────────────────── */
function QuickBadge({ icon: Icon, label, value, color, delay = 0 }: {
  icon: React.ElementType; label: string; value: string | number; color: string; delay?: number;
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl"
      style={{
        background: `linear-gradient(135deg,${color}18,${color}08)`,
        border: `1px solid ${color}30`,
        boxShadow: `0 2px 12px ${color}14, inset 0 1px 0 rgba(255,255,255,.05)`,
        animation: `_pg-badge-in .5s ${delay}s cubic-bezier(.22,1,.36,1) both`,
      }}>
      <Icon size={12} color={color} />
      <span className="text-[11px] font-black text-white tabular-nums">{value}</span>
      <span className="text-[10px]" style={{ color: `${color}88` }}>{label}</span>
    </div>
  );
}

/* ─── Page header ────────────────────────────────────────────── */
function AnalyticsHeader({ bookmarks }: { bookmarks: any[] }) {
  const total    = bookmarks.length;
  const favs     = bookmarks.filter(b => b.isFavorite).length;
  const domains  = new Set(bookmarks.map(b => b.domain).filter(Boolean)).size;
  const last7    = bookmarks.filter(b => new Date(b.createdAt) > new Date(Date.now() - 7*86400000)).length;

  return (
    <header className="relative shrink-0 border-b border-white/[0.06] overflow-hidden"
      style={{ background: "rgba(5,5,14,.94)", backdropFilter: "blur(28px)" }}>
      <style>{PAGE_CSS}</style>

      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="_pg-orb-a absolute rounded-full blur-[70px]"
          style={{ width:300, height:300, top:"-60%", left:"-5%", backgroundColor:"#6366f128" }} />
        <div className="_pg-orb-b absolute rounded-full blur-[90px]"
          style={{ width:260, height:260, top:"-40%", right:"10%", backgroundColor:"#8b5cf620" }} />
        <div className="_pg-orb-c absolute rounded-full blur-[60px]"
          style={{ width:180, height:180, bottom:"-30%", left:"50%", backgroundColor:"#06b6d418" }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none _pg-scan" />

      <HeaderParticles />

      <div className="relative px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: title */}
          <div className="_pg-hdr-in">
            <div className="flex items-center gap-3 mb-1.5">
              {/* Animated icon cluster */}
              <div className="relative size-10 shrink-0">
                <div className="absolute inset-0 rounded-2xl _pg-spin"
                  style={{ background:"conic-gradient(from 0deg,#6366f1,#8b5cf6,#06b6d4,#6366f1)", padding:1 }}>
                  <div className="w-full h-full rounded-2xl" style={{ background:"rgba(5,5,14,.9)" }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center _pg-float">
                  <BarChart3 size={18} color="#818cf8" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="_pg-title text-[20px] font-black leading-none tracking-tight">Analytics</h1>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{ background:"rgba(99,102,241,.2)", color:"#818cf8", border:"1px solid rgba(99,102,241,.3)", letterSpacing:".1em" }}>
                    LIVE
                    <span className="inline-block size-1.5 rounded-full bg-indigo-400 ml-1 _pg-pulse" />
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color:"rgba(255,255,255,.3)" }}>
                  Deep insights into your saved web
                </p>
              </div>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <QuickBadge icon={Database}    label="bookmarks"  value={total}   color="#6366f1" delay={.05} />
              <QuickBadge icon={Star}        label="favorites"  value={favs}    color="#f59e0b" delay={.10} />
              <QuickBadge icon={Globe}       label="domains"    value={domains} color="#10b981" delay={.15} />
              <QuickBadge icon={TrendingUp}  label="this week"  value={last7}   color="#ec4899" delay={.20} />
            </div>
          </div>

          {/* Right: decorative chart bars */}
          <div className="hidden sm:flex items-end gap-[3px] h-14 shrink-0 opacity-30 _pg-pulse">
            {[40,65,30,85,55,70,45,90,60,75].map((h, i) => (
              <div key={i} className="w-[5px] rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: `linear-gradient(to top,${["#6366f1","#8b5cf6","#06b6d4","#ec4899","#10b981"][i%5]},transparent)`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Section wrapper with reveal ──────────────────────────── */
function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { data: bookmarks = [], isLoading } = useListBookmarks({} as any, {
    query: { queryKey: getListBookmarksQueryKey() },
  });
  const bks = bookmarks as any[];

  return (
    <AppLayout>
      <AnalyticsHeader bookmarks={bks} />

      <div className="flex-1 overflow-y-auto" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(99,102,241,.04),transparent 60%)" }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80 gap-5">
            {/* Animated loader */}
            <div className="relative size-16">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400"
                style={{ animation:"_pg-spin .9s linear infinite" }} />
              <div className="absolute inset-2 rounded-full border-t-2 border-violet-400/60"
                style={{ animation:"_pg-spin 1.4s linear infinite reverse" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 size={16} color="#818cf8" />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white/40 text-center">Loading analytics…</p>
              <p className="text-[10px] text-white/20 text-center mt-1">Crunching your data</p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-6 max-w-[1600px] mx-auto">
            <Section delay={0}>
              <AnalyticsDashboard bookmarks={bks} />
            </Section>

            <Section delay={0.05}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <TagCloud
                    bookmarks={bks}
                    onTagClick={tag => setLocation(`/app?tag=${tag}`)}
                  />
                </div>
                <div>
                  <RecentActivity
                    bookmarks={bks}
                    onSelect={() => setLocation("/app")}
                    limit={12}
                  />
                </div>
              </div>
            </Section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
