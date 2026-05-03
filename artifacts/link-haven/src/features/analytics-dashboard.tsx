import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Bookmark, Star, Archive, Pin, Hash, TrendingUp, Globe,
  BarChart3, Clock, Zap, Sparkles, Calendar, Link2,
  FileText, Video, Image, File, Music, ArrowUp, Database,
  Flame, Target, Award, Brain,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
@keyframes _an-float-a { 0%,100%{transform:translateY(0px) rotate(0deg)}33%{transform:translateY(-12px) rotate(1.5deg)}66%{transform:translateY(-6px) rotate(-1deg)} }
@keyframes _an-float-b { 0%,100%{transform:translateY(0px) scale(1)}50%{transform:translateY(-18px) scale(1.04)} }
@keyframes _an-float-c { 0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-8px) rotate(-2deg)}75%{transform:translateY(-14px) rotate(2deg)} }
@keyframes _an-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes _an-pulse-ring { 0%{box-shadow:0 0 0 0 var(--rc,#6366f166)} 70%{box-shadow:0 0 0 10px transparent} 100%{box-shadow:0 0 0 0 transparent} }
@keyframes _an-shimmer { 0%{background-position:-300% center} 100%{background-position:300% center} }
@keyframes _an-glow { 0%,100%{opacity:.35} 50%{opacity:.75} }
@keyframes _an-orb { 0%,100%{transform:translate(0,0)scale(1);opacity:.25} 33%{transform:translate(60px,-40px)scale(1.3);opacity:.45} 66%{transform:translate(-40px,30px)scale(.85);opacity:.3} }
@keyframes _an-orb2 { 0%,100%{transform:translate(0,0)scale(1);opacity:.2} 50%{transform:translate(-70px,50px)scale(1.25);opacity:.4} }
@keyframes _an-orb3 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(50px,60px)scale(1.15)} }
@keyframes _an-particle { 0%{transform:translate(0,0);opacity:0} 10%{opacity:.8} 90%{opacity:.4} 100%{transform:translate(var(--pdx),var(--pdy));opacity:0} }
@keyframes _an-scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
@keyframes _an-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
@keyframes _an-bar-in { from{width:0%} }
@keyframes _an-bounce-in { 0%{transform:scale(0) rotate(-10deg);opacity:0} 60%{transform:scale(1.12) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
@keyframes _an-gradient-pan { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
@keyframes _an-ripple { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
@keyframes _an-drift { 0%{transform:translate(0,0)rotate(0deg)} 25%{transform:translate(3px,-4px)rotate(1deg)} 50%{transform:translate(-2px,3px)rotate(-1deg)} 75%{transform:translate(4px,2px)rotate(.5deg)} 100%{transform:translate(0,0)rotate(0deg)} }
@keyframes _an-number-in { from{opacity:0;transform:translateY(10px)scale(.9)} to{opacity:1;transform:translateY(0)scale(1)} }
@keyframes _an-slide-r { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
@keyframes _an-slide-u { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes _an-pop { 0%{opacity:0;transform:scale(.8)} 70%{transform:scale(1.06)} 100%{opacity:1;transform:scale(1)} }
@keyframes _an-hue-rotate { from{filter:hue-rotate(0deg)} to{filter:hue-rotate(360deg)} }
@keyframes _an-wave { 0%{d:path("M0,10 Q25,0 50,10 T100,10")} 50%{d:path("M0,10 Q25,20 50,10 T100,10")} 100%{d:path("M0,10 Q25,0 50,10 T100,10")} }
@keyframes _an-tag-pop { 0%{opacity:0;transform:scale(.5) rotate(-15deg)} 70%{transform:scale(1.1) rotate(2deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
@keyframes _an-card-in { 0%{opacity:0;transform:translateY(28px) scale(.96)} 100%{opacity:1;transform:translateY(0) scale(1)} }
@keyframes _an-icon-bounce { 0%,100%{transform:translateY(0) scale(1)} 40%{transform:translateY(-5px) scale(1.1)} 60%{transform:translateY(-2px) scale(1.05)} }
@keyframes _an-border-flow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes _an-ping { 0%{transform:scale(1);opacity:.75} 100%{transform:scale(2.2);opacity:0} }
@keyframes _an-heatmap-in { from{opacity:0;transform:scale(0) rotate(45deg)} to{opacity:1;transform:scale(1) rotate(0)} }

._an-float-a { animation:_an-float-a var(--fdur,4.5s) ease-in-out infinite; }
._an-float-b { animation:_an-float-b var(--fdur,5.5s) ease-in-out infinite; }
._an-float-c { animation:_an-float-c var(--fdur,3.8s) ease-in-out infinite; }
._an-shimmer { background-size:300% 100%; animation:_an-shimmer 2s linear infinite; }
._an-breathe { animation:_an-breathe 3s ease-in-out infinite; }
._an-drift { animation:_an-drift 8s ease-in-out infinite; }
._an-orb { animation:_an-orb var(--odur,18s) ease-in-out infinite; }
._an-orb2 { animation:_an-orb2 var(--odur,24s) ease-in-out infinite; }
._an-orb3 { animation:_an-orb3 var(--odur,14s) ease-in-out infinite; }
._an-spin-slow { animation:_an-spin-slow 25s linear infinite; }
._an-glow { animation:_an-glow 2.5s ease-in-out infinite; }
._an-pulse-ring { animation:_an-pulse-ring 2s ease-out infinite; }
._an-hue { animation:_an-hue-rotate 12s linear infinite; }

._shimmer-text {
  background: linear-gradient(90deg, #c4b5fd, #818cf8, #38bdf8, #34d399, #c4b5fd);
  background-size: 300% 100%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: _an-shimmer 3s linear infinite;
}
._grad-border {
  position:relative;
}
._grad-border::before {
  content:'';
  position:absolute; inset:-1px; border-radius:inherit; z-index:-1;
  background:linear-gradient(135deg,#6366f160,#8b5cf650,#06b6d440,transparent,#6366f160);
  background-size:300% 300%;
  animation:_an-border-flow 4s ease infinite;
}
._glass-card {
  background:rgba(255,255,255,.032);
  border:1px solid rgba(255,255,255,.07);
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
}
._glass-card:hover {
  background:rgba(255,255,255,.048);
  border-color:rgba(255,255,255,.11);
}
._live-dot::after {
  content:'';position:absolute;inset:-2px;border-radius:50%;
  border:1.5px solid #34d399;
  animation:_an-ping 2s ease-out infinite;
}
`;

/* ─── Types ────────────────────────────────────────────────── */
interface BookmarkItem {
  id: number; title: string; url: string; domain?: string; type?: string;
  tags?: string[]; isFavorite?: boolean; isArchived?: boolean; isPinned?: boolean;
  createdAt: string; note?: string; favicon?: string;
}

/* ─── Helpers ──────────────────────────────────────────────── */
const PALETTE = ["#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b","#ef4444","#06b6d4","#84cc16","#f97316","#14b8a6","#a78bfa","#fb7185"];
const TYPE_META: Record<string,{icon:React.ElementType;color:string;label:string}> = {
  link:     { icon:Link2,    color:"#6366f1", label:"Links"     },
  article:  { icon:FileText, color:"#8b5cf6", label:"Articles"  },
  image:    { icon:Image,    color:"#10b981", label:"Images"    },
  video:    { icon:Video,    color:"#ef4444", label:"Videos"    },
  document: { icon:File,     color:"#f59e0b", label:"Documents" },
  audio:    { icon:Music,    color:"#06b6d4", label:"Audio"     },
};

/* ─── Animated number counter ──────────────────────────────── */
function AnimatedNumber({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setVal(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [inView, to, duration]);
  return <span ref={ref} style={{ display: "inline-block", animation: "_an-number-in .5s cubic-bezier(.22,1,.36,1) both" }}>{val.toLocaleString()}</span>;
}

/* ─── Floating particles ────────────────────────────────────── */
function FloatingParticles({ count = 28 }: { count?: number }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    color: PALETTE[i % PALETTE.length],
    duration: 6 + Math.random() * 10,
    delay: Math.random() * 8,
    dx: (Math.random() - 0.5) * 120,
    dy: -(Math.random() * 80 + 40),
  })), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            backgroundColor: p.color + "99",
            animation: `_an-particle ${p.duration}s ${p.delay}s ease-in-out infinite`,
            ["--pdx" as any]: `${p.dx}px`,
            ["--pdy" as any]: `${p.dy}px`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}66`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Aurora orbs ───────────────────────────────────────────── */
function AuroraOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="_an-orb absolute rounded-full blur-[80px]"
        style={{ width:320, height:320, top:"-10%", left:"5%", backgroundColor:"#6366f128", ["--odur" as any]:"22s" }} />
      <div className="_an-orb2 absolute rounded-full blur-[100px]"
        style={{ width:280, height:280, top:"30%", right:"10%", backgroundColor:"#8b5cf620", ["--odur" as any]:"18s" }} />
      <div className="_an-orb3 absolute rounded-full blur-[90px]"
        style={{ width:240, height:240, bottom:"5%", left:"40%", backgroundColor:"#06b6d418", ["--odur" as any]:"15s" }} />
      <div className="_an-orb absolute rounded-full blur-[120px]"
        style={{ width:200, height:200, bottom:"20%", right:"5%", backgroundColor:"#ec489918", ["--odur" as any]:"28s" }} />
    </div>
  );
}

/* ─── Glass tooltip for recharts ────────────────────────────── */
function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"rgba(8,8,20,.94)", border:"1px solid rgba(255,255,255,.12)",
      borderRadius:12, padding:"8px 14px", backdropFilter:"blur(20px)",
      boxShadow:"0 8px 32px rgba(0,0,0,.5)",
    }}>
      {label && <p style={{ color:"rgba(255,255,255,.4)", fontSize:10, marginBottom:4, fontWeight:600 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || "#818cf8", fontSize:14, fontWeight:800 }}>
          {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ─── Stat card ─────────────────────────────────────────────── */
const STAT_VARIANTS = {
  container: { hidden:{}, visible:{ transition:{ staggerChildren:.09, delayChildren:.15 } } },
  card:      { hidden:{ opacity:0, y:28, scale:.92 }, visible:{ opacity:1, y:0, scale:1, transition:{ type:"spring" as const, stiffness:260, damping:22 } } },
};

function StatCard({ icon: Icon, label, value, sub, color, delay = 0, trend }: {
  icon: React.ElementType; label: string; value: number; sub?: string;
  color: string; delay?: number; trend?: "up"|"down"|"flat";
}) {
  const sparkData = useMemo(() => Array.from({length:8}, () => Math.random() * 80 + 10), []);
  return (
    <motion.div
      variants={STAT_VARIANTS.card}
      whileHover={{ scale:1.035, y:-4, transition:{ type:"spring", stiffness:400, damping:22 } }}
      whileTap={{ scale:.97 }}
      className="relative rounded-2xl overflow-hidden cursor-default group"
      style={{ background:`linear-gradient(145deg,${color}1a,${color}08)`, border:`1px solid ${color}30`, boxShadow:`0 4px 24px ${color}14, inset 0 1px 0 rgba(255,255,255,.06)` }}
    >
      {/* Animated top border */}
      <div className="absolute top-0 inset-x-0 h-[1.5px]" style={{ background:`linear-gradient(90deg,transparent,${color}cc,transparent)`, animation:`_an-shimmer 2.5s ${delay}s linear infinite`, backgroundSize:"300% 100%" }} />
      {/* Glow blob */}
      <div className="absolute -top-6 -right-6 size-24 rounded-full blur-3xl pointer-events-none _an-breathe" style={{ backgroundColor:`${color}20` }} />
      {/* Ripple ring */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity"
        style={{ boxShadow:`inset 0 0 20px ${color}18` }} />

      <div className="relative p-4">
        {/* Icon row */}
        <div className="flex items-center justify-between mb-3">
          <div className="relative size-9 rounded-xl flex items-center justify-center _an-drift"
            style={{ background:`linear-gradient(145deg,${color}30,${color}15)`, border:`1px solid ${color}35`, boxShadow:`0 2px 10px ${color}20, inset 0 1px 0 rgba(255,255,255,.08)` }}>
            <Icon size={16} color={color} strokeWidth={2.2} />
            {/* Ping dot */}
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full" style={{ backgroundColor:color }}>
              <span className="absolute inset-0 rounded-full" style={{ backgroundColor:color, animation:`_an-ping 2.5s ${delay}s ease-out infinite` }} />
            </span>
          </div>
          {trend && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: trend==="up"?"rgba(16,185,129,.18)":trend==="down"?"rgba(239,68,68,.15)":"rgba(255,255,255,.07)", color: trend==="up"?"#34d399":trend==="down"?"#f87171":"rgba(255,255,255,.35)" }}>
              {trend==="up"?<ArrowUp size={8}/>:trend==="down"?<ArrowUp size={8} style={{transform:"rotate(180deg)"}}/>:null}
              {trend==="up"?"↑":trend==="down"?"↓":"—"}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="text-[28px] font-black text-white leading-none mb-1 tabular-nums"
          style={{ textShadow:`0 0 24px ${color}55` }}>
          <AnimatedNumber to={value} />
        </div>

        {/* Label */}
        <div className="text-[10.5px] font-semibold uppercase tracking-[.12em]" style={{ color:`${color}bb` }}>{label}</div>
        {sub && <div className="text-[10px] text-white/25 mt-1">{sub}</div>}

        {/* Mini sparkline */}
        <div className="flex items-end gap-[2px] mt-3 h-8">
          {sparkData.map((v, i) => (
            <div key={i} className="flex-1 rounded-sm transition-all"
              style={{
                height:`${v}%`, minHeight:2,
                background:`${color}${30+i*8 < 99 ? (30+i*8).toString(16).padStart(2,"0") : "99"}`,
                animation:`_an-bar-in .6s ${.05*i+delay}s cubic-bezier(.34,1.56,.64,1) both`,
              }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Activity heatmap ──────────────────────────────────────── */
function ActivityHeatmap({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"0px 0px -60px 0px" });

  const data = useMemo(() => {
    const map: Record<string,number> = {};
    bookmarks.forEach(b => {
      const key = b.createdAt.slice(0,10);
      map[key] = (map[key]||0)+1;
    });
    const cells = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      cells.push({ key, count: map[key]||0, date:d });
    }
    return cells;
  }, [bookmarks]);

  const maxCount = Math.max(...data.map(d=>d.count), 1);

  const getColor = (count: number) => {
    if (count===0) return "rgba(255,255,255,.04)";
    const t = count/maxCount;
    if (t < .25) return "#6366f140";
    if (t < .5)  return "#6366f180";
    if (t < .75) return "#6366f1bb";
    return "#6366f1";
  };

  return (
    <div ref={ref} className="_glass-card rounded-2xl p-5 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 80% 20%,#6366f112,transparent 60%)" }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="size-7 rounded-lg flex items-center justify-center" style={{ background:"#6366f120", border:"1px solid #6366f130" }}>
          <Calendar size={14} color="#818cf8" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Activity Heatmap</h3>
        <span className="ml-auto text-[10px] text-white/25">Last 84 days</span>
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns:`repeat(12,1fr)` }}>
        {data.map((cell, i) => (
          <div key={cell.key} className="group relative cursor-default">
            <div
              className="rounded-[3px] transition-transform hover:scale-125"
              style={{
                height:14,
                backgroundColor:getColor(cell.count),
                animation:`_an-heatmap-in .4s ${i*.008}s cubic-bezier(.34,1.56,.64,1) both`,
                boxShadow: cell.count>0 ? `0 0 ${cell.count*3}px #6366f144` : "none",
                opacity: inView ? 1 : 0,
              }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg text-[9px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20"
              style={{ background:"rgba(6,6,18,.95)", border:"1px solid rgba(255,255,255,.12)" }}>
              <span className="text-white/80 font-semibold">{cell.count}</span>
              <span className="text-white/35 ml-1">{cell.date.toLocaleDateString("en",{month:"short",day:"numeric"})}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[9px] text-white/25">Less</span>
        {[0,.25,.5,.75,1].map((t,i) => (
          <div key={i} className="size-2.5 rounded-sm" style={{ backgroundColor:getColor(Math.round(t*maxCount)) }} />
        ))}
        <span className="text-[9px] text-white/25">More</span>
      </div>
    </div>
  );
}

/* ─── Daily activity chart ──────────────────────────────────── */
function DailyActivityChart({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true });

  const data = useMemo(() => {
    const now = new Date();
    const map: Record<string,number> = {};
    bookmarks.forEach(b => { const k=b.createdAt.slice(0,10); map[k]=(map[k]||0)+1; });
    return Array.from({length:30},(_,i)=>{
      const d = new Date(now); d.setDate(d.getDate()-(29-i));
      const key = d.toISOString().slice(0,10);
      return { day: d.toLocaleDateString("en",{month:"short",day:"numeric"}), count:map[key]||0, date:key };
    });
  }, [bookmarks]);

  const peak = data.reduce((m,d) => d.count>m.count?d:m, data[0]);

  return (
    <div ref={ref} className="_glass-card rounded-2xl p-5 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 10% 80%,#6366f110,transparent 55%)" }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="size-7 rounded-lg flex items-center justify-center _an-breathe" style={{ background:"#6366f120", border:"1px solid #6366f130" }}>
          <BarChart3 size={14} color="#818cf8" />
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-white/80">Daily Activity</h3>
          <p className="text-[10px] text-white/25">Last 30 days</p>
        </div>
        {peak?.count > 0 && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background:"#f59e0b14", border:"1px solid #f59e0b25" }}>
            <Flame size={10} color="#fbbf24" />
            <span className="text-[10px] font-bold text-amber-300">Peak: {peak.count} on {peak.day}</span>
          </div>
        )}
      </div>
      {inView && (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top:4, right:0, left:-28, bottom:0 }}>
            <defs>
              <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45}/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false}/>
            <XAxis dataKey="day" tick={{ fill:"rgba(255,255,255,.2)", fontSize:9 }} tickLine={false} axisLine={false} interval={4}/>
            <YAxis tick={{ fill:"rgba(255,255,255,.2)", fontSize:9 }} tickLine={false} axisLine={false} allowDecimals={false}/>
            <Tooltip content={<GlassTooltip />} cursor={{ stroke:"rgba(255,255,255,.08)", strokeWidth:1 }}/>
            <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2.5} fill="url(#actGrad)"
              dot={false} activeDot={{ r:4, fill:"#818cf8", stroke:"#0a0a18", strokeWidth:2 }}
              animationBegin={0} animationDuration={1200} animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ─── Domain leaderboard ────────────────────────────────────── */
function DomainLeaderboard({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"0px 0px -40px 0px" });

  const domains = useMemo(() => {
    const map: Record<string,number> = {};
    bookmarks.forEach(b => { if (b.domain) map[b.domain]=(map[b.domain]||0)+1; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8);
  }, [bookmarks]);

  if (!domains.length) return null;
  const max = domains[0][1];

  return (
    <div ref={ref} className="_glass-card rounded-2xl p-5 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 90% 50%,#10b98110,transparent 55%)" }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="size-7 rounded-lg flex items-center justify-center" style={{ background:"#10b98120", border:"1px solid #10b98130" }}>
          <Globe size={14} color="#34d399" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Top Domains</h3>
        <span className="ml-auto text-[10px] text-white/25">{domains.length} sources</span>
      </div>
      <div className="space-y-2.5">
        {domains.map(([domain, count], i) => {
          const pct = (count/max)*100;
          const color = PALETTE[i % PALETTE.length];
          return (
            <motion.div
              key={domain}
              initial={{ opacity:0, x:-20 }}
              animate={inView ? { opacity:1, x:0 } : {}}
              transition={{ delay:i*.07, type:"spring", stiffness:260, damping:22 }}
              className="group"
            >
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[10px] font-black tabular-nums" style={{ color, minWidth:14 }}>#{i+1}</span>
                <img src={`https://${domain}/favicon.ico`} alt="" className="size-3.5 rounded-sm object-contain"
                  onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                <span className="text-[12px] text-white/65 truncate flex-1 group-hover:text-white/90 transition-colors">{domain}</span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{count}</span>
              </div>
              <div className="h-[5px] rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,.05)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width:`${inView?pct:0}%`,
                    background:`linear-gradient(90deg,${color},${color}88)`,
                    boxShadow:`0 0 8px ${color}55`,
                    animation: inView ? `_an-bar-in .8s ${i*.08}s cubic-bezier(.34,1.56,.64,1) both` : "none",
                    transition:"width .8s ease",
                  }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Content type donut ─────────────────────────────────────── */
function ContentTypeDonut({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true });

  const data = useMemo(() => {
    const map: Record<string,number> = {};
    bookmarks.forEach(b => { const t=b.type||"link"; map[t]=(map[t]||0)+1; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([type,count],i) => ({
      type, count, color: PALETTE[i%PALETTE.length],
      label: (TYPE_META[type]?.label) || type.charAt(0).toUpperCase()+type.slice(1),
    }));
  }, [bookmarks]);

  const total = data.reduce((s,d)=>s+d.count,0);

  return (
    <div ref={ref} className="_glass-card rounded-2xl p-5 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 100%,#8b5cf612,transparent 60%)" }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="size-7 rounded-lg flex items-center justify-center _an-breathe" style={{ background:"#8b5cf620", border:"1px solid #8b5cf630" }}>
          <Database size={14} color="#a78bfa" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Content Types</h3>
      </div>
      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width:110, height:110 }}>
          {inView && (
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={data} cx={50} cy={50} innerRadius={32} outerRadius={50}
                  dataKey="count" strokeWidth={2} stroke="rgba(6,6,18,1)"
                  animationBegin={0} animationDuration={1000} animationEasing="ease-out">
                  {data.map((d,i)=><Cell key={i} fill={d.color} opacity={.9}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[17px] font-black text-white tabular-nums"><AnimatedNumber to={total}/></span>
            <span className="text-[8.5px] text-white/30 font-semibold">TOTAL</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {data.slice(0,6).map((d,i)=>{
            const Icon = TYPE_META[d.type]?.icon || Link2;
            return (
              <motion.div key={d.type}
                initial={{opacity:0,x:10}} animate={inView?{opacity:1,x:0}:{}}
                transition={{delay:i*.08,type:"spring",stiffness:260,damping:22}}
                className="flex items-center gap-2 group hover:opacity-100 transition-opacity"
              >
                <div className="size-4 rounded shrink-0 flex items-center justify-center" style={{ background:`${d.color}22`, border:`1px solid ${d.color}35` }}>
                  <Icon size={9} color={d.color}/>
                </div>
                <span className="text-[11px] text-white/50 truncate flex-1 group-hover:text-white/80 transition-colors">{d.label}</span>
                <span className="text-[11px] font-bold tabular-nums" style={{color:d.color}}>{d.count}</span>
                <span className="text-[9px] text-white/20">{total>0?Math.round(d.count/total*100):0}%</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Tag universe ──────────────────────────────────────────── */
function TagUniverse({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"0px 0px -60px 0px" });

  const tags = useMemo(() => {
    const map: Record<string,number> = {};
    bookmarks.forEach(b => b.tags?.forEach(t => { map[t]=(map[t]||0)+1; }));
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,40);
  }, [bookmarks]);

  if (!tags.length) return null;
  const max = tags[0][1];
  const min = tags[tags.length-1][1];

  const getFs = (count: number) => {
    const t = max===min ? .5 : (count-min)/(max-min);
    return 10 + t*14;
  };

  const floatAnims = ["_an-float-a","_an-float-b","_an-float-c"];

  return (
    <div ref={ref} className="_glass-card rounded-2xl p-5 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 50%,#06b6d40a,transparent 70%)" }} />
      <div className="flex items-center gap-2 mb-5">
        <div className="size-7 rounded-lg flex items-center justify-center _an-spin-slow" style={{ background:"#06b6d420", border:"1px solid #06b6d430" }}>
          <Hash size={14} color="#22d3ee" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Tag Universe</h3>
        <span className="ml-auto text-[10px] text-white/25">{tags.length} tags</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-3 leading-relaxed">
        {tags.map(([tag, count], i) => {
          const color = PALETTE[i % PALETTE.length];
          const fs = getFs(count);
          const anim = floatAnims[i % floatAnims.length];
          return (
            <motion.button
              key={tag}
              initial={{ opacity:0, scale:.4, rotate:-15 }}
              animate={inView ? { opacity:1, scale:1, rotate:0 } : {}}
              transition={{ delay:i*.035, type:"spring", stiffness:280, damping:18 }}
              whileHover={{ scale:1.18, transition:{ type:"spring", stiffness:500, damping:20 } }}
              whileTap={{ scale:.92 }}
              className={anim}
              style={{
                fontSize:fs, fontWeight: fs>18?900:fs>14?700:600,
                color, display:"inline-flex", alignItems:"center", gap:3,
                ["--fdur" as any]: `${3+Math.random()*3}s`,
                animationDelay: `${i*.12}s`,
                textShadow: `0 0 ${fs}px ${color}55`,
                cursor:"pointer",
              }}
              title={`${count} bookmark${count!==1?"s":""}`}
            >
              <Hash size={fs*.55} opacity={.6}/>{tag}
              <span style={{ fontSize:fs*.6, opacity:.45, marginLeft:1 }}>({count})</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Insight cards ──────────────────────────────────────────── */
function InsightCards({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true });

  const insights = useMemo(() => {
    if (!bookmarks.length) return [];

    const domMap: Record<string,number> = {};
    bookmarks.forEach(b => { if(b.domain) domMap[b.domain]=(domMap[b.domain]||0)+1; });
    const topDom = Object.entries(domMap).sort((a,b)=>b[1]-a[1])[0];

    const tagMap: Record<string,number> = {};
    bookmarks.forEach(b => b.tags?.forEach(t=>{tagMap[t]=(tagMap[t]||0)+1;}));
    const topTag = Object.entries(tagMap).sort((a,b)=>b[1]-a[1])[0];

    const now = new Date();
    const last7 = bookmarks.filter(b=>new Date(b.createdAt)>new Date(now.getTime()-7*86400000)).length;
    const prev7 = bookmarks.filter(b=>{const t=new Date(b.createdAt).getTime(); return t>now.getTime()-14*86400000&&t<=now.getTime()-7*86400000;}).length;
    const growth = prev7>0?Math.round((last7-prev7)/prev7*100):last7>0?100:0;

    const favPct = bookmarks.length>0?Math.round(bookmarks.filter(b=>b.isFavorite).length/bookmarks.length*100):0;

    return [
      { icon:Award, color:"#f59e0b", title:"Top Source", value:topDom?topDom[0]:"—", sub:topDom?`${topDom[1]} saves`:undefined, desc:"Your most-visited domain" },
      { icon:Flame, color:"#ef4444", title:"Weekly Growth", value:growth>0?`+${growth}%`:growth<0?`${growth}%`:"—", sub:`${last7} this week`, desc:"vs last 7 days", trend:growth>0?"up":growth<0?"down":"flat" as any },
      { icon:Target, color:"#06b6d4", title:"Top Tag", value:topTag?`#${topTag[0]}`:"—", sub:topTag?`${topTag[1]} bookmarks`:undefined, desc:"Most used tag" },
      { icon:Brain, color:"#8b5cf6", title:"Curation Rate", value:`${favPct}%`, sub:`${bookmarks.filter(b=>b.isFavorite).length} starred`, desc:"Bookmarks marked favorite" },
    ];
  }, [bookmarks]);

  return (
    <div ref={ref}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={15} color="#818cf8" className="_an-breathe" />
        <h3 className="text-[13px] font-bold text-white/70">Library Insights</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity:0, y:20, scale:.9 }}
              animate={inView ? { opacity:1, y:0, scale:1 } : {}}
              transition={{ delay:i*.1, type:"spring", stiffness:260, damping:22 }}
              whileHover={{ scale:1.04, transition:{ type:"spring", stiffness:400 } }}
              className="_grad-border rounded-2xl overflow-hidden cursor-default"
              style={{ background:`linear-gradient(145deg,${ins.color}12,${ins.color}06)`, border:`1px solid ${ins.color}25` }}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="size-7 rounded-lg flex items-center justify-center" style={{ background:`${ins.color}20`, border:`1px solid ${ins.color}30` }}>
                    <Icon size={13} color={ins.color} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:`${ins.color}99` }}>{ins.title}</span>
                </div>
                <div className="text-[18px] font-black text-white leading-none truncate" style={{ textShadow:`0 0 20px ${ins.color}44` }}>{ins.value}</div>
                {ins.sub && <div className="text-[10px] mt-1" style={{color:`${ins.color}88`}}>{ins.sub}</div>}
                <div className="text-[9.5px] text-white/22 mt-1.5 leading-tight">{ins.desc}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Weekly trend bars ─────────────────────────────────────── */
function WeeklyTrend({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true });

  const data = useMemo(() => {
    const now = new Date();
    return Array.from({length:12},(_,i)=>{
      const start = new Date(now.getTime()-(11-i)*7*86400000);
      const end   = new Date(now.getTime()-(10-i)*7*86400000);
      const count = bookmarks.filter(b=>{const t=new Date(b.createdAt).getTime(); return t>=start.getTime()&&t<end.getTime();}).length;
      return { week:`W${12-i}`, count, label: start.toLocaleDateString("en",{month:"short",day:"numeric"}) };
    }).reverse().reverse();
  }, [bookmarks]);

  const max = Math.max(...data.map(d=>d.count),1);

  return (
    <div ref={ref} className="_glass-card rounded-2xl p-5 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 0%,#ec489912,transparent 60%)" }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="size-7 rounded-lg flex items-center justify-center" style={{ background:"#ec489920", border:"1px solid #ec489930" }}>
          <TrendingUp size={14} color="#f472b6" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Weekly Trend</h3>
        <span className="ml-auto text-[10px] text-white/25">12 weeks</span>
      </div>
      {inView && (
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} margin={{top:2,right:0,left:-30,bottom:0}} barSize={14}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={.9}/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={.7}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{fill:"rgba(255,255,255,.2)",fontSize:8}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fill:"rgba(255,255,255,.2)",fontSize:8}} tickLine={false} axisLine={false} allowDecimals={false}/>
            <Tooltip content={<GlassTooltip/>} cursor={{fill:"rgba(255,255,255,.04)"}}/>
            <Bar dataKey="count" fill="url(#barGrad)" radius={[4,4,0,0]}
              animationBegin={0} animationDuration={1000} animationEasing="ease-out"/>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ─── Recent saves ──────────────────────────────────────────── */
const ITEM_VARIANTS = {
  container:{ hidden:{}, visible:{ transition:{ staggerChildren:.06, delayChildren:.1 } } },
  item:{ hidden:{opacity:0,x:-16}, visible:{ opacity:1, x:0, transition:{ type:"spring" as const, stiffness:280, damping:22 } } },
};

function RecentSaves({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"0px 0px -40px 0px" });

  const recent = useMemo(() =>
    [...bookmarks].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,8),
    [bookmarks]
  );

  if (!recent.length) return null;

  return (
    <div ref={ref} className="_glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <div className="size-7 rounded-lg flex items-center justify-center _an-breathe" style={{ background:"#06b6d420", border:"1px solid #06b6d430" }}>
          <Clock size={14} color="#22d3ee" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Recent Saves</h3>
        <span className="ml-auto text-[10px] text-white/25">Latest {recent.length}</span>
      </div>
      <motion.div variants={ITEM_VARIANTS.container} initial="hidden" animate={inView?"visible":"hidden"} className="divide-y divide-white/[0.04]">
        {recent.map((b,i) => {
          const meta = TYPE_META[b.type||"link"] || TYPE_META.link;
          const Icon = meta.icon;
          return (
            <motion.div key={b.id} variants={ITEM_VARIANTS.item}
              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition-all group cursor-default">
              {/* Favicon/icon */}
              <div className="relative shrink-0 size-8 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform"
                style={{ background:`linear-gradient(145deg,${meta.color}28,${meta.color}12)`, border:`1px solid ${meta.color}25` }}>
                {b.favicon ? (
                  <img src={b.favicon} alt="" className="size-4 object-contain"
                    onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                ) : <Icon size={13} color={meta.color}/>}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/75 truncate group-hover:text-white/95 transition-colors">{b.title}</p>
                <p className="text-[10px] text-white/28 truncate">{b.domain}</p>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {b.isFavorite && (
                  <span className="size-5 rounded-md flex items-center justify-center" style={{background:"#f59e0b14"}}>
                    <Star size={9} color="#fbbf24" fill="#fbbf24"/>
                  </span>
                )}
                {b.isPinned && (
                  <span className="size-5 rounded-md flex items-center justify-center" style={{background:"#6366f114"}}>
                    <Pin size={9} color="#818cf8"/>
                  </span>
                )}
                <span className="text-[9.5px] text-white/20 whitespace-nowrap ml-1">
                  {new Date(b.createdAt).toLocaleDateString("en",{month:"short",day:"numeric"})}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────── */
export function AnalyticsDashboard({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const total = bookmarks.length;
  const favs  = bookmarks.filter(b=>b.isFavorite).length;
  const arch  = bookmarks.filter(b=>b.isArchived).length;
  const pinned= bookmarks.filter(b=>b.isPinned).length;
  const tagged= bookmarks.filter(b=>b.tags&&b.tags.length>0).length;
  const noted = bookmarks.filter((b:any)=>b.note).length;

  const now = new Date();
  const last30 = bookmarks.filter(b=>new Date(b.createdAt)>new Date(now.getTime()-30*86400000)).length;

  const statCards = [
    { icon:Bookmark,    label:"Total Saves",  value:total,   color:"#6366f1", trend:"up"   as const, delay:0    },
    { icon:Star,        label:"Favourites",   value:favs,    color:"#f59e0b", trend:"flat" as const, delay:.06  },
    { icon:Archive,     label:"Archived",     value:arch,    color:"#64748b", trend:"flat" as const, delay:.12  },
    { icon:Pin,         label:"Pinned",       value:pinned,  color:"#8b5cf6", trend:"flat" as const, delay:.18  },
    { icon:Hash,        label:"Tagged",       value:tagged,  color:"#10b981", trend:"up"   as const, delay:.24  },
    { icon:TrendingUp,  label:"Last 30 Days", value:last30,  color:"#ec4899", trend:"up"   as const, delay:.30  },
  ];

  return (
    <>
      <style>{CSS}</style>

      {/* Stats grid */}
      <motion.div
        variants={STAT_VARIANTS.container}
        initial="hidden" animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {statCards.map(c => <StatCard key={c.label} {...c} />)}
      </motion.div>

      {/* Insights */}
      <InsightCards bookmarks={bookmarks} />

      {/* Activity strip */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <DailyActivityChart bookmarks={bookmarks} />
        </div>
        <div className="lg:col-span-2">
          <WeeklyTrend bookmarks={bookmarks} />
        </div>
      </div>

      {/* Heatmap */}
      <ActivityHeatmap bookmarks={bookmarks} />

      {/* Domain + Type + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <DomainLeaderboard bookmarks={bookmarks} />
        </div>
        <div>
          <ContentTypeDonut bookmarks={bookmarks} />
        </div>
        <div>
          <RecentSaves bookmarks={bookmarks} />
        </div>
      </div>

      {/* Tag universe */}
      {bookmarks.some(b=>b.tags?.length) && <TagUniverse bookmarks={bookmarks} />}
    </>
  );
}
