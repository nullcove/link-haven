import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, getGetMeQueryKey, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  Settings, User, BarChart3, Keyboard, Palette, Bot,
  ChevronRight, Bookmark, FolderOpen, Tag, Star, Archive,
  Sparkles, CalendarDays, Shield, Mail, UserCircle2,
  LayoutGrid, List, Zap, Check,
} from "lucide-react";
import { Link } from "wouter";

/* ─── Animation CSS ─────────────────────────────────────────── */
const CSS = `
@keyframes _s-popIn  { 0%{transform:scale(.55) rotate(-8deg);opacity:0} 65%{transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
@keyframes _s-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes _s-spin   { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes _s-ring   { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.2);opacity:0} }
@keyframes _s-breathe{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.14)} }
@keyframes _s-twinkle{ 0%,100%{filter:brightness(1)} 45%{filter:brightness(.6)} 50%{filter:brightness(2) drop-shadow(0 0 6px currentColor)} }
@keyframes _s-shd    { 0%{transform:translateX(-200%)} 100%{transform:translateX(300%)} }
@keyframes _s-barA   { 0%,100%{height:35%} 50%{height:75%} }
@keyframes _s-barB   { 0%,100%{height:55%} 50%{height:95%} }
@keyframes _s-barC   { 0%,100%{height:45%} 50%{height:65%} }
@keyframes _s-countUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

._s-popIn   { animation: _s-popIn .42s cubic-bezier(.22,1,.36,1) both; }
._s-float   { animation: _s-float 3s ease-in-out infinite; }
._s-spin    { animation: _s-spin  8s linear infinite; }
._s-breathe { animation: _s-breathe 2.8s ease-in-out infinite; }
._s-twinkle { animation: _s-twinkle 2.4s ease-in-out infinite; }
._s-countUp { animation: _s-countUp .5s cubic-bezier(.22,1,.36,1) both; }

/* Hover scale for Icon3D */
._s-icon:hover { transform: scale(1.1) translateY(-1px); filter: brightness(1.15); }
._s-icon { transition: transform .2s cubic-bezier(.22,1,.36,1), filter .2s ease, box-shadow .2s ease; }
`;

/* ─── Big 3D section icon ────────────────────────────────────── */
function Icon3D({
  icon: Ic, color, size = 42,
  anim = "none",
  delay = 0,
}: {
  icon: React.ElementType; color: string; size?: number;
  anim?: "float" | "spin" | "breathe" | "twinkle" | "none";
  delay?: number;
}) {
  const r = Math.round(size * 0.3);
  const animClass = anim !== "none" ? `_s-${anim}` : "";

  return (
    <span
      className="_s-icon _s-popIn relative flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: r,
        animationDelay: `${delay}ms`,
        background: `
          radial-gradient(circle at 32% 28%, ${color}65 0%, transparent 55%),
          linear-gradient(145deg, ${color}45 0%, ${color}1c 100%)
        `,
        border: `1.5px solid ${color}48`,
        boxShadow: `
          0 6px 20px ${color}35,
          0 2px 8px ${color}28,
          0 0 0 1px ${color}20,
          inset 0 2.5px 0 rgba(255,255,255,.18),
          inset 0 -2px 0 rgba(0,0,0,.22)
        `,
      }}
    >
      {/* Specular highlight */}
      <span className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ borderRadius: r, background: "linear-gradient(138deg, rgba(255,255,255,.28) 0%, transparent 46%)" }} />

      {/* Pulse ring */}
      <span className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: r, border: `1.5px solid ${color}55`, animation: "_s-ring 2.4s ease-out infinite" }} />

      {/* Shimmer sweep */}
      <span className="absolute pointer-events-none overflow-hidden"
        style={{ inset: 0, borderRadius: r, overflow: "hidden" }}>
        <span style={{
          position: "absolute", top: 0, bottom: 0, width: "35%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent)",
          animation: "_s-shd 3.2s ease-in-out infinite",
          animationDelay: `${delay + 400}ms`,
        }} />
      </span>

      <Ic
        className={animClass}
        style={{
          width: size * 0.5, height: size * 0.5,
          color: "#fff",
          filter: `drop-shadow(0 2px 6px ${color}70) drop-shadow(0 0 12px ${color}45)`,
          position: "relative", zIndex: 1, flexShrink: 0,
        }}
        strokeWidth={1.8}
      />
    </span>
  );
}

/* ─── Live bar chart icon (for stats section) ───────────────── */
function BarChartIcon3D({ color, size = 42 }: { color: string; size?: number }) {
  const r = Math.round(size * 0.3);
  return (
    <span className="_s-icon _s-popIn relative flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: r, animationDelay: "120ms",
        background: `radial-gradient(circle at 32% 28%, ${color}65, transparent 55%), linear-gradient(145deg, ${color}45, ${color}1c)`,
        border: `1.5px solid ${color}48`,
        boxShadow: `0 6px 20px ${color}35, 0 2px 8px ${color}28, inset 0 2.5px 0 rgba(255,255,255,.18), inset 0 -2px 0 rgba(0,0,0,.22)`,
      }}>
      <span className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: r, background: "linear-gradient(138deg, rgba(255,255,255,.28) 0%, transparent 46%)" }} />
      <span className="absolute inset-0 pointer-events-none" style={{ borderRadius: r, border: `1.5px solid ${color}55`, animation: "_s-ring 2.4s ease-out .3s infinite" }} />
      {/* Animated bars */}
      <span className="relative z-10 flex items-end gap-[2px]" style={{ height: size * 0.46, width: size * 0.46 }}>
        {[
          { h: "35%", anim: "_s-barA", delay: "0ms" },
          { h: "65%", anim: "_s-barB", delay: "180ms" },
          { h: "50%", anim: "_s-barC", delay: "90ms" },
        ].map((bar, i) => (
          <span key={i} className="flex-1 rounded-sm"
            style={{
              height: bar.h, minHeight: "20%",
              background: `linear-gradient(to top, ${color}, rgba(255,255,255,.8))`,
              filter: `drop-shadow(0 1px 3px ${color}80)`,
              animation: `${bar.anim} 1.6s ease-in-out infinite`,
              animationDelay: bar.delay,
            }} />
        ))}
      </span>
    </span>
  );
}

/* ─── Section card ───────────────────────────────────────────── */
function Section({
  iconEl, title, description, color, children, delay = 0,
}: {
  iconEl: React.ReactNode; title: string; description?: string;
  color: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <div className="rounded-2xl overflow-hidden _s-popIn"
      style={{
        background: "linear-gradient(145deg, #131219, #0e0e16)",
        border: "1px solid rgba(255,255,255,.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,.4), 0 0 0 0.5px rgba(255,255,255,.03), inset 0 1px 0 rgba(255,255,255,.04)",
        animationDelay: `${delay}ms`,
      }}>
      <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-white/[0.05]"
        style={{ background: `linear-gradient(90deg, ${color}0d, transparent 65%)` }}>
        {iconEl}
        <div>
          <h2 className="text-[14.5px] font-black text-white leading-none">{title}</h2>
          {description && <p className="text-[11.5px] text-white/32 mt-1">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─── Stat tile with live icon animation ─────────────────────── */
function StatTile({
  icon: Ic, label, value, color, delay = 0,
}: { icon: React.ElementType; label: string; value: number; color: string; delay?: number }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/[0.06] p-4 flex flex-col gap-2.5 cursor-default _s-countUp"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,.025), rgba(255,255,255,.01))",
        animationDelay: `${delay}ms`,
        transition: "transform .18s ease, box-shadow .18s ease",
        transform: hov ? "translateY(-2px) scale(1.02)" : "",
        boxShadow: hov ? `0 8px 24px ${color}22` : "",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="absolute top-0 inset-x-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${color}70, transparent)` }} />
      <span className="flex items-center justify-between">
        <span className="size-[30px] flex items-center justify-center rounded-[9px] relative"
          style={{
            background: `radial-gradient(circle at 32% 28%, ${color}50, transparent 58%), linear-gradient(145deg, ${color}32, ${color}12)`,
            border: `1px solid ${color}30`,
            boxShadow: `0 2px 8px ${color}22, inset 0 1.5px 0 rgba(255,255,255,.1)`,
          }}>
          <span className="absolute inset-0 rounded-[9px]" style={{ background: "linear-gradient(138deg, rgba(255,255,255,.18) 0%, transparent 48%)" }} />
          <Ic style={{ width: 14, height: 14, color: "#fff", filter: `drop-shadow(0 1px 3px ${color}70)`, position: "relative", zIndex: 1 }} strokeWidth={2} />
        </span>
      </span>
      <span className="text-[28px] font-black leading-none" style={{ color, textShadow: `0 0 20px ${color}50` }}>{value.toLocaleString()}</span>
      <span className="text-[11px] text-white/35 font-semibold leading-none">{label}</span>
    </div>
  );
}

/* ─── AI provider logos ─────────────────────────────────────── */
const LOGOS: Record<string, string> = {
  OpenAI:"https://cdn.simpleicons.org/openai/10a37f",
  Anthropic:"https://cdn.simpleicons.org/anthropic/d97706",
  Gemini:"https://cdn.simpleicons.org/googlegemini/4285f4",
  Mistral:"https://cdn.simpleicons.org/mistralai/f97316",
  Groq:"https://cdn.simpleicons.org/groq/7c3aed",
  Perplexity:"https://cdn.simpleicons.org/perplexity/06b6d4",
  Cohere:"https://cdn.simpleicons.org/cohere/14b8a6",
  OpenRouter:"https://cdn.simpleicons.org/openrouter/6366f1",
  Together:"https://cdn.simpleicons.org/togetherai/10b981",
  Ollama:"https://cdn.simpleicons.org/ollama/e879f9",
};
const PCOLORS: Record<string, string> = {
  OpenAI:"#10a37f",Anthropic:"#d97706",Gemini:"#4285f4",Mistral:"#f97316",Groq:"#7c3aed",
  Perplexity:"#06b6d4",Cohere:"#14b8a6",OpenRouter:"#6366f1",Together:"#10b981",Ollama:"#e879f9",
};

function ProviderChip({ name }: { name: string }) {
  const [hov, setHov] = useState(false);
  const c = PCOLORS[name] || "#6366f1";
  return (
    <div
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border cursor-default"
      style={{
        background: hov ? `${c}18` : "rgba(255,255,255,.02)",
        borderColor: hov ? `${c}45` : "rgba(255,255,255,.06)",
        transition: "all .18s ease",
        transform: hov ? "translateY(-2px) scale(1.04)" : "",
        boxShadow: hov ? `0 6px 18px ${c}22` : "",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span className="size-10 rounded-xl flex items-center justify-center relative"
        style={{
          background: `radial-gradient(circle at 32% 28%, ${c}45, transparent 58%), linear-gradient(145deg, ${c}30, ${c}10)`,
          border: `1px solid ${c}35`,
          boxShadow: hov ? `0 4px 12px ${c}40, inset 0 1.5px 0 rgba(255,255,255,.12)` : `0 2px 6px ${c}18, inset 0 1.5px 0 rgba(255,255,255,.08)`,
        }}>
        <span className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(138deg, rgba(255,255,255,.18) 0%, transparent 46%)" }} />
        <img src={LOGOS[name]} alt={name} width={22} height={22} className="object-contain relative z-10"
          onError={e => (e.target as HTMLImageElement).style.display = "none"} draggable={false} />
      </span>
      <span className="text-[9.5px] font-semibold leading-none text-center" style={{ color: hov ? c : "rgba(255,255,255,.35)" }}>
        {name}
      </span>
    </div>
  );
}

/* ─── Preference toggle ─────────────────────────────────────── */
function ViewToggle({ value, selected, onSelect, icon: Ic, label }: {
  value: string; selected: boolean; onSelect: (v: string) => void;
  icon: React.ElementType; label: string;
}) {
  return (
    <button onClick={() => onSelect(value)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold border transition-all hover:scale-[1.02] active:scale-[.98]"
      style={{
        background: selected ? "linear-gradient(135deg, rgba(99,102,241,.2), rgba(139,92,246,.12))" : "rgba(255,255,255,0.03)",
        borderColor: selected ? "rgba(99,102,241,.4)" : "rgba(255,255,255,.08)",
        color: selected ? "#a5b4fc" : "rgba(255,255,255,.4)",
        boxShadow: selected ? "0 4px 12px rgba(99,102,241,.2), inset 0 1px 0 rgba(255,255,255,.06)" : "",
      }}>
      <Ic className="size-3.5" />
      {label}
      {selected && <Check className="size-3 ml-auto" />}
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });
  const [defaultView, setDefaultView] = useState<string>("grid");

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <header className="h-14 shrink-0 border-b border-white/[0.055] flex items-center gap-3 px-6 sticky top-0 z-10"
        style={{ background: "rgba(9,9,15,.88)", backdropFilter: "blur(20px)" }}>
        <Icon3D icon={Settings} color="#94a3b8" size={30} anim="spin" />
        <div>
          <h1 className="font-black text-[15px] text-white leading-none">Settings</h1>
          <p className="text-[10px] text-white/22 mt-px">Account &amp; preferences</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: "#08080e" }}>
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Profile */}
          <Section delay={0} color="#6366f1" title="Profile" description="Your account information"
            iconEl={<Icon3D icon={UserCircle2} color="#6366f1" size={42} anim="float" delay={80} />}>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="size-16 rounded-full flex items-center justify-center text-[20px] font-black text-white uppercase"
                  style={{
                    background: "radial-gradient(circle at 35% 30%, rgba(139,92,246,.7), rgba(99,102,241,.25))",
                    border: "2px solid rgba(99,102,241,.45)",
                    boxShadow: "0 4px 20px rgba(99,102,241,.35), inset 0 2px 0 rgba(255,255,255,.15)",
                  }}>
                  {user?.name?.substring(0, 2)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full border-2 border-[#08080e] flex items-center justify-center"
                  style={{ background: "linear-gradient(145deg,#34d399,#059669)", boxShadow: "0 0 8px rgba(52,211,153,.6)" }}>
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
              </div>
              <div>
                <h3 className="font-black text-[17px] text-white">{user?.name}</h3>
                <p className="text-[12px] text-white/32 mt-0.5 flex items-center gap-1.5">
                  <Mail className="size-3" style={{ color: "rgba(255,255,255,.25)" }} />
                  {user?.isGuest ? "Guest session" : user?.email}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black px-2.5 py-1 rounded-full"
                  style={{
                    background: user?.isGuest ? "rgba(100,116,139,.18)" : "linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.15))",
                    color: user?.isGuest ? "#94a3b8" : "#c4b5fd",
                    border: `1px solid ${user?.isGuest ? "rgba(100,116,139,.3)" : "rgba(99,102,241,.4)"}`,
                    boxShadow: user?.isGuest ? "" : "0 2px 8px rgba(99,102,241,.2)",
                  }}>
                  {user?.isGuest ? "👤 Guest" : <><Sparkles className="size-2.5" />Pro Member</>}
                </span>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { label: "Display Name", value: user?.name, disabled: user?.isGuest },
                { label: "Email", value: user?.isGuest ? "Guest session" : user?.email, disabled: true },
              ].map(({ label, value, disabled }) => (
                <div key={label}>
                  <label className="text-[11px] font-bold text-white/30 block mb-1.5 uppercase tracking-wider">{label}</label>
                  <input defaultValue={value} disabled={disabled}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: disabled ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.75)" }}
                    onFocus={e => !disabled && (e.currentTarget.style.borderColor = "rgba(99,102,241,.5)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
              ))}
            </div>
            {user && !user.isGuest && (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/20">
                <CalendarDays className="size-3" />Member since {format(new Date(user.createdAt), "MMMM yyyy")}
              </p>
            )}
          </Section>

          {/* AI Models */}
          <Section delay={60} color="#a855f7" title="AI Models" description="Connect cloud APIs or your local Ollama GPU"
            iconEl={<Icon3D icon={Bot} color="#a855f7" size={42} anim="breathe" delay={140} />}>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.keys(LOGOS).map(p => <ProviderChip key={p} name={p} />)}
            </div>
            <Link href="/ai-settings"
              className="flex items-center justify-between w-full p-3.5 rounded-xl border transition-all group hover:scale-[1.01]"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,.1), rgba(139,92,246,.06))",
                borderColor: "rgba(99,102,241,.22)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,.4)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,.22)")}>
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-4 text-indigo-400" />
                <span className="text-[13px] font-semibold text-indigo-300 group-hover:text-indigo-200">Manage AI providers &amp; API keys</span>
              </div>
              <ChevronRight className="size-4 text-indigo-400/50 group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5" />
            </Link>
          </Section>

          {/* Stats */}
          <Section delay={100} color="#06b6d4" title="Usage Statistics"
            description={user ? `Member since ${format(new Date(user.createdAt), "MMMM yyyy")}` : undefined}
            iconEl={<BarChartIcon3D color="#06b6d4" size={42} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatTile icon={Bookmark}     label="Total Bookmarks"  value={stats?.totalBookmarks || 0}    color="#6366f1" delay={0}   />
              <StatTile icon={FolderOpen}   label="Collections"      value={stats?.totalCollections || 0}  color="#8b5cf6" delay={40}  />
              <StatTile icon={Tag}          label="Tags"             value={stats?.totalTags || 0}          color="#06b6d4" delay={80}  />
              <StatTile icon={Star}         label="Favourites"       value={stats?.totalFavorites || 0}     color="#f59e0b" delay={120} />
              <StatTile icon={Archive}      label="Archived"         value={stats?.totalArchived || 0}      color="#64748b" delay={160} />
              <StatTile icon={CalendarDays} label="This Month"       value={stats?.bookmarksThisMonth || 0} color="#10b981" delay={200} />
            </div>
          </Section>

          {/* Preferences */}
          <Section delay={140} color="#ec4899" title="Preferences"
            iconEl={<Icon3D icon={Palette} color="#ec4899" size={42} anim="breathe" delay={200} />}>
            <div>
              <label className="text-[11px] font-bold text-white/30 block mb-2.5 uppercase tracking-wider">Default View</label>
              <div className="flex gap-2">
                <ViewToggle value="grid" selected={defaultView === "grid"} onSelect={setDefaultView} icon={LayoutGrid} label="Grid" />
                <ViewToggle value="list" selected={defaultView === "list"} onSelect={setDefaultView} icon={List} label="List" />
              </div>
            </div>
          </Section>

          {/* Keyboard shortcuts */}
          <Section delay={180} color="#10b981" title="Keyboard Shortcuts"
            iconEl={<Icon3D icon={Keyboard} color="#10b981" size={42} anim="none" delay={240} />}>
            <div className="space-y-0">
              {[
                { key: "⌘K",    label: "Open command palette" },
                { key: "⌘N",    label: "Add new bookmark" },
                { key: "⌘F",    label: "Focus search" },
                { key: "⌘J",    label: "Toggle AI chat" },
                { key: "G → A", label: "Go to All Bookmarks" },
                { key: "G → S", label: "Go to Settings" },
                { key: "Esc",   label: "Close dialog / panel" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-[12.5px] text-white/48">{label}</span>
                  <kbd className="inline-flex items-center gap-1 text-[10.5px] px-2.5 py-1 rounded-lg font-mono"
                    style={{
                      background: "linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
                      border: "1px solid rgba(255,255,255,.1)",
                      color: "rgba(255,255,255,.5)",
                      boxShadow: "0 2px 0 rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.07)",
                    }}>
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </Section>

          {/* Security */}
          <Section delay={220} color="#f59e0b" title="Security"
            iconEl={<Icon3D icon={Shield} color="#f59e0b" size={42} anim="float" delay={280} />}>
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06]"
              style={{ background: "rgba(255,255,255,.02)" }}>
              <div className="flex items-center gap-3">
                <span className="size-9 rounded-xl flex items-center justify-center relative"
                  style={{ background: "radial-gradient(circle at 32% 28%, rgba(245,158,11,.45), transparent 58%), linear-gradient(145deg, rgba(245,158,11,.3), rgba(245,158,11,.1))", border: "1px solid rgba(245,158,11,.3)", boxShadow: "0 2px 8px rgba(245,158,11,.2), inset 0 1.5px 0 rgba(255,255,255,.1)" }}>
                  <span className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(138deg, rgba(255,255,255,.18) 0%, transparent 48%)" }} />
                  <Zap className="size-4 text-amber-300 relative z-10" strokeWidth={2} style={{ filter: "drop-shadow(0 1px 3px rgba(245,158,11,.7))" }} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-white/72">Two-factor authentication</p>
                  <p className="text-[11px] text-white/28 mt-0.5">Add extra security to your account</p>
                </div>
              </div>
              <span className="text-[9.5px] font-black px-2.5 py-1 rounded-full"
                style={{ background: "rgba(245,158,11,.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,.25)" }}>
                Coming soon
              </span>
            </div>
          </Section>

        </div>
      </div>
    </AppLayout>
  );
}
