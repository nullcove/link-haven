import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, getGetMeQueryKey, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  Settings, Keyboard, Palette, Bot,
  ChevronDown, Bookmark, FolderOpen, Tag, Star, Archive,
  Sparkles, CalendarDays, Shield, Mail, UserCircle2,
  LayoutGrid, List, Zap, Check, Image as ImageIcon, X, Key,
} from "lucide-react";
import { Link } from "wouter";
import { BACKGROUNDS, BG_CATEGORIES, BG_CATEGORY_META, useBg } from "@/lib/background";
import { ClayIcon, ClayBarIcon, ClayDot } from "@/components/ui/clay-icon";

/* ─── Page-specific CSS (accordion + bg-picker only) ─────────── */
const PAGE_CSS = `
@keyframes _acc-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes _bgSel  { from{opacity:0;transform:scale(.82)} to{opacity:1;transform:scale(1)} }
._acc-body { overflow:hidden; transition:max-height .35s cubic-bezier(.4,0,.2,1),opacity .3s ease; }
._bg-thumb { transition:transform .16s ease,box-shadow .16s ease; }
._bg-thumb:hover { transform:scale(1.05) translateY(-2px); }
._bgSel { animation:_bgSel .22s ease both; }
._acc-card {
  border-radius: 22px;
  overflow: hidden;
  transition: border-color .28s ease, box-shadow .28s ease;
}
._acc-card:hover { box-shadow: 0 10px 36px rgba(0,0,0,.5) !important; }
`;

/* ─── User Avatar ─────────────────────────────────────────────── */
function nameToColor(name: string) {
  const p = ["#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b","#06b6d4","#f97316","#14b8a6"];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}
function lighten(hex: string): string {
  const m = hex.replace("#","").match(/.{2}/g);
  if (!m || m.length < 3) return hex + "99";
  const [r,g,b] = m.map(c => parseInt(c,16));
  const mix = (v: number) => Math.round(v + (255-v)*0.42).toString(16).padStart(2,"0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function UserAvatar({ name, size = 64 }: { name: string; size?: number }) {
  const color = nameToColor(name);
  const lt = lighten(color);
  const initials = name.split(" ").map(w => w[0]).filter(Boolean).join("").substring(0,2).toUpperCase();
  const dot = Math.round(size * 0.27);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="relative rounded-full flex items-center justify-center font-black text-white overflow-hidden select-none"
        style={{
          width: size, height: size,
          fontSize: Math.round(size * 0.34),
          letterSpacing: "-0.02em",
          background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,.88) 0%, ${lt} 28%, ${color} 62%)`,
          boxShadow: `0 8px 28px ${color}55, 0 3px 10px rgba(0,0,0,.28), inset 0 -4px 10px rgba(0,0,0,.16), inset 0 4px 14px rgba(255,255,255,.5)`,
        }}>
        <span className="absolute pointer-events-none"
          style={{ top: "12%", left: "16%", width: "32%", height: "22%", borderRadius: "50%", background: "radial-gradient(ellipse,rgba(255,255,255,.75) 0%,transparent 100%)", filter: "blur(2.5px)" }} />
        <span className="relative z-10">{initials}</span>
      </div>
      <span className="absolute rounded-full"
        style={{ width: dot, height: dot, bottom: 1, right: 1,
          background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,.7) 0%, #22c55e 55%)",
          boxShadow: "0 2px 8px #22c55e80, inset 0 1px 3px rgba(255,255,255,.5)",
          border: "2.5px solid rgba(8,8,14,.9)" }} />
    </div>
  );
}

/* ─── Accordion Section ───────────────────────────────────────── */
function AccordionSection({
  iconEl, title, color, badge, defaultOpen = false, children,
}: {
  iconEl: React.ReactNode; title: string; color: string;
  badge?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState(defaultOpen ? "9999px" : "0px");
  const [rendered, setRendered] = useState(defaultOpen);

  useEffect(() => {
    if (open) {
      const h = (bodyRef.current?.scrollHeight ?? 800) + 80;
      setMaxH(`${h}px`);
      setRendered(true);
    } else {
      setMaxH("0px");
    }
  }, [open]);

  return (
    <div className="_acc-card clay-anim-pop"
      style={{
        background: "linear-gradient(158deg, rgba(255,255,255,.044), rgba(255,255,255,.014))",
        border: `1.5px solid ${open ? color + "38" : "rgba(255,255,255,.07)"}`,
        boxShadow: open
          ? `0 8px 32px rgba(0,0,0,.45), 0 0 0 1px ${color}18, inset 0 1px 0 rgba(255,255,255,.06)`
          : "0 4px 20px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.03)",
        backdropFilter: "blur(18px)",
      }}>

      {/* Header */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left group"
        style={{
          background: open ? `linear-gradient(100deg, ${color}12 0%, transparent 65%)` : "transparent",
          transition: "background .3s ease",
        }}>

        {/* left accent bar */}
        <span className="shrink-0 rounded-full" style={{
          width: 3, height: 26,
          background: open ? `linear-gradient(to bottom, ${color}, ${color}44)` : "rgba(255,255,255,.06)",
          transition: "background .3s ease, transform .3s ease",
          transform: open ? "scaleY(1)" : "scaleY(.5)",
        }} />

        {iconEl}

        <div className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-black text-white leading-tight">{title}</span>
          {!open && badge && (
            <span className="block mt-[2px] text-[10px] truncate" style={{ color: "rgba(255,255,255,.28)" }}>{badge}</span>
          )}
        </div>

        <ChevronDown className="size-4 shrink-0 transition-all duration-300"
          style={{
            color: open ? color : "rgba(255,255,255,.2)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            filter: open ? `drop-shadow(0 0 5px ${color}55)` : "none",
          }} />
      </button>

      {/* Body */}
      <div ref={bodyRef} className="_acc-body" style={{ maxHeight: maxH, opacity: open ? 1 : 0 }} aria-hidden={!open}>
        <div style={{ height: 1, background: open ? `linear-gradient(to right, ${color}38, transparent 80%)` : "transparent", margin: "0 18px", transition: "background .3s" }} />
        <div className="px-4 pb-5 pt-4">
          {rendered && children}
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Tile ───────────────────────────────────────────────── */
function StatTile({ icon: Ic, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.05] p-3 flex flex-col gap-2 cursor-default transition-all hover:scale-[1.03] hover:-translate-y-[2px]"
      style={{ background: "linear-gradient(150deg, rgba(255,255,255,.026), rgba(255,255,255,.008))", backdropFilter: "blur(8px)" }}>
      <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color}80, transparent)` }} />
      <ClayDot icon={Ic} color={color} size={26} />
      <span className="text-[24px] font-black leading-none tabular-nums" style={{ color, textShadow: `0 0 18px ${color}45` }}>
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] text-white/30 font-semibold leading-tight">{label}</span>
    </div>
  );
}

/* ─── Background Picker ──────────────────────────────────────── */
function BgPicker() {
  const { bgId, bgItem, setBg } = useBg();
  return (
    <div className="space-y-4">
      {bgItem ? (
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 80, boxShadow: "0 6px 20px rgba(0,0,0,.4)" }}>
          <img src={bgItem.path} alt={bgItem.name} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(4,4,11,.9) 0%, rgba(4,4,11,.4) 60%, transparent 100%)" }} />
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Active Wallpaper</p>
              <p className="text-[14px] font-black text-white leading-none">{bgItem.name}</p>
              <p className="text-[10px] mt-0.5 font-bold" style={{ color: BG_CATEGORY_META[bgItem.category].accent }}>
                {BG_CATEGORY_META[bgItem.category].glyph} {bgItem.category}
              </p>
            </div>
            <button onClick={() => setBg(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-bold border transition-all hover:scale-105"
              style={{ background: "rgba(0,0,0,.55)", borderColor: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.45)", backdropFilter: "blur(10px)" }}>
              <X className="size-2.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.05]" style={{ background: "rgba(255,255,255,.015)" }}>
          <X className="size-3 text-white/15 shrink-0" />
          <p className="text-[11.5px] text-white/20">No wallpaper active — solid dark background</p>
        </div>
      )}

      {BG_CATEGORIES.map(cat => {
        const meta = BG_CATEGORY_META[cat];
        const items = BACKGROUNDS.filter(b => b.category === cat);
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10.5px] font-black" style={{ color: meta.accent }}>{meta.glyph}</span>
              <span className="text-[9.5px] font-black text-white/45 uppercase tracking-[0.15em]">{cat}</span>
              <span className="size-[15px] rounded-full flex items-center justify-center text-[8px] font-black"
                style={{ background: `${meta.accent}20`, color: meta.accent }}>{items.length}</span>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${meta.accent}28, transparent)` }} />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {items.map(bg => {
                const sel = bgId === bg.id;
                return (
                  <button key={bg.id} onClick={() => setBg(sel ? null : bg.id)}
                    className="_bg-thumb relative rounded-xl overflow-hidden cursor-pointer"
                    style={{
                      paddingBottom: "58%",
                      border: `2px solid ${sel ? meta.accent : "rgba(255,255,255,.06)"}`,
                      boxShadow: sel ? `0 0 0 1.5px ${meta.accent}50, 0 6px 18px ${meta.accent}35` : "0 2px 6px rgba(0,0,0,.22)",
                    }}>
                    <img src={bg.path} alt={bg.name} className="absolute inset-0 w-full h-full object-cover" draggable={false} loading="lazy" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.04) 55%)" }} />
                    {sel && (
                      <>
                        <div className="absolute inset-0" style={{ background: `${meta.accent}15` }} />
                        <span className="_bgSel absolute top-1.5 right-1.5 size-[16px] rounded-full flex items-center justify-center"
                          style={{
                            background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,.7) 0%, ${meta.accent} 60%)`,
                            boxShadow: `0 2px 8px ${meta.accent}70, inset 0 1px 3px rgba(255,255,255,.5)`,
                          }}>
                          <Check className="size-2.5 text-white" strokeWidth={3} />
                        </span>
                      </>
                    )}
                    <span className="absolute bottom-1 left-1.5 right-6 text-[7.5px] font-bold text-white/75 leading-tight truncate">{bg.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── AI Provider logos ───────────────────────────────────────── */
const LOGOS: Record<string, string> = {
  OpenAI:"https://cdn.simpleicons.org/openai/10a37f", Anthropic:"https://cdn.simpleicons.org/anthropic/d97706",
  Gemini:"https://cdn.simpleicons.org/googlegemini/4285f4", Mistral:"https://cdn.simpleicons.org/mistralai/f97316",
  Groq:"https://cdn.simpleicons.org/groq/7c3aed", Perplexity:"https://cdn.simpleicons.org/perplexity/06b6d4",
  Cohere:"https://cdn.simpleicons.org/cohere/14b8a6", OpenRouter:"https://cdn.simpleicons.org/openrouter/6366f1",
  Together:"https://cdn.simpleicons.org/togetherai/10b981", Ollama:"https://cdn.simpleicons.org/ollama/e879f9",
};
const PCOLORS: Record<string, [string, string]> = {
  OpenAI:["#10a37f","#6ee7b7"], Anthropic:["#d97706","#fcd34d"], Gemini:["#4285f4","#93c5fd"],
  Mistral:["#f97316","#fdba74"], Groq:["#7c3aed","#c4b5fd"], Perplexity:["#06b6d4","#67e8f9"],
  Cohere:["#14b8a6","#5eead4"], OpenRouter:["#6366f1","#a5b4fc"],
  Together:["#10b981","#6ee7b7"], Ollama:["#e879f9","#f5d0fe"],
};

/* ─── View Toggle ─────────────────────────────────────────────── */
function ViewToggle({ value, selected, onSelect, icon: Ic, label }: {
  value: string; selected: boolean; onSelect: (v: string) => void; icon: React.ElementType; label: string;
}) {
  return (
    <button onClick={() => onSelect(value)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold border transition-all hover:scale-[1.02]"
      style={{
        background: selected ? "linear-gradient(135deg,rgba(99,102,241,.22),rgba(139,92,246,.12))" : "rgba(255,255,255,.03)",
        borderColor: selected ? "rgba(99,102,241,.45)" : "rgba(255,255,255,.07)",
        color: selected ? "#a5b4fc" : "rgba(255,255,255,.35)",
        boxShadow: selected ? "0 4px 14px rgba(99,102,241,.2), inset 0 1px 0 rgba(255,255,255,.06)" : "",
      }}>
      <Ic className="size-3.5" /> {label}
      {selected && <Check className="size-3 ml-1 text-indigo-400" />}
    </button>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });
  const { bgItem } = useBg();
  const [defaultView, setDefaultView] = useState<string>("grid");

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* Header */}
      <header className="h-14 shrink-0 border-b border-white/[0.07] flex items-center gap-3 px-5 sticky top-0 z-10"
        style={{ background: "rgba(6,6,12,.9)", backdropFilter: "blur(24px)" }}>
        <ClayIcon icon={Settings} color="#64748b" light="#94a3b8" size={36} anim="spin" />
        <div>
          <h1 className="font-black text-[15px] text-white leading-none tracking-tight">Settings</h1>
          <p className="text-[10px] text-white/28 mt-[2px]">Account &amp; preferences</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-5 px-4" style={{ background: "transparent" }}>
        <div className="max-w-xl mx-auto space-y-3">

          {/* 1. Profile */}
          <AccordionSection defaultOpen title="Profile" color="#6366f1" badge={user?.name}
            iconEl={<ClayIcon icon={UserCircle2} color="#6366f1" light="#a5b4fc" size={38} anim="float" animDelay={50} />}>
            <div className="flex items-start gap-4 mb-5">
              {user && <UserAvatar name={user.name} size={66} />}
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-black text-[17px] text-white leading-none truncate">{user?.name}</h3>
                <p className="text-[11px] text-white/30 mt-1.5 flex items-center gap-1.5">
                  <Mail className="size-3 shrink-0 text-white/20" />
                  {user?.isGuest ? "Guest — no email" : user?.email}
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black px-2.5 py-1 rounded-full"
                    style={{
                      background: user?.isGuest ? "rgba(100,116,139,.18)" : "linear-gradient(135deg,rgba(99,102,241,.3),rgba(139,92,246,.18))",
                      color: user?.isGuest ? "#94a3b8" : "#c4b5fd",
                      border: `1px solid ${user?.isGuest ? "rgba(100,116,139,.3)" : "rgba(99,102,241,.45)"}`,
                      boxShadow: user?.isGuest ? "" : "0 2px 10px rgba(99,102,241,.22)",
                    }}>
                    {user?.isGuest ? "👤 Guest" : <><Sparkles className="size-2.5" />Pro</>}
                  </span>
                  {user && !user.isGuest && (
                    <span className="text-[10px] text-white/22 flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      Since {format(new Date(user.createdAt), "MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { label: "Display Name", value: user?.name, disabled: user?.isGuest },
                { label: "Email", value: user?.isGuest ? "Guest session" : user?.email, disabled: true },
              ].map(({ label, value, disabled }) => (
                <div key={label}>
                  <label className="text-[9px] font-black text-white/25 block mb-1.5 uppercase tracking-widest">{label}</label>
                  <input defaultValue={value} disabled={disabled}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                    style={{ background: "rgba(255,255,255,.04)", border: "1.5px solid rgba(255,255,255,.07)", color: disabled ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.75)" }}
                    onFocus={e => !disabled && (e.currentTarget.style.borderColor = "rgba(99,102,241,.5)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,.07)")} />
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 2. Background */}
          <AccordionSection defaultOpen title="Background Wallpaper" color="#06b6d4"
            badge={bgItem ? `${BG_CATEGORY_META[bgItem.category].glyph} ${bgItem.name}` : "No wallpaper set"}
            iconEl={<ClayIcon icon={ImageIcon} color="#0891b2" light="#67e8f9" size={38} anim="breathe" animDelay={80} />}>
            <BgPicker />
          </AccordionSection>

          {/* 3. AI Models */}
          <AccordionSection title="AI Models" color="#a855f7" badge="10 providers"
            iconEl={<ClayIcon icon={Bot} color="#9333ea" light="#d8b4fe" size={38} anim="breathe" animDelay={120} />}>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(LOGOS).map(([name]) => {
                const [c, l] = PCOLORS[name] || ["#6366f1","#a5b4fc"];
                return (
                  <div key={name}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border cursor-default transition-all hover:scale-105"
                    style={{ background: "rgba(255,255,255,.02)", borderColor: "rgba(255,255,255,.06)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background=`${c}18`; (e.currentTarget as HTMLElement).style.borderColor=`${c}35`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.02)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,.06)"; }}>
                    <span className="size-9 rounded-xl flex items-center justify-center relative"
                      style={{
                        background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,.88) 0%, ${l} 28%, ${c} 60%)`,
                        boxShadow: `0 5px 14px ${c}45, 0 2px 5px rgba(0,0,0,.22), inset 0 -2px 6px rgba(0,0,0,.14), inset 0 2px 8px rgba(255,255,255,.52)`,
                      }}>
                      <span className="absolute pointer-events-none" style={{ top:"10%", left:"12%", width:"34%", height:"22%", borderRadius:"50%", background:"radial-gradient(ellipse,rgba(255,255,255,.7) 0%,transparent 100%)", filter:"blur(1.5px)", zIndex:2 }} />
                      <img src={LOGOS[name]} alt={name} width={18} height={18} className="object-contain relative z-10" draggable={false}
                        onError={e => (e.target as HTMLImageElement).style.display="none"} />
                    </span>
                    <span className="text-[8px] font-semibold text-center leading-tight" style={{ color: "rgba(255,255,255,.35)" }}>{name}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/ai-settings"
              className="flex items-center justify-between w-full p-3.5 rounded-2xl border transition-all group hover:scale-[1.015]"
              style={{ background: "linear-gradient(135deg,rgba(168,85,247,.12),rgba(139,92,246,.06))", borderColor: "rgba(168,85,247,.22)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor="rgba(168,85,247,.5)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor="rgba(168,85,247,.22)")}>
              <div className="flex items-center gap-3">
                <ClayDot icon={Key} color="#9333ea" light="#d8b4fe" size={32} />
                <div>
                  <p className="text-[12.5px] font-black text-purple-300 group-hover:text-purple-200 leading-none transition-colors">Manage API keys &amp; models</p>
                  <p className="text-[10px] text-white/25 mt-0.5">Configure providers, test connections</p>
                </div>
              </div>
              <ChevronDown className="size-4 text-purple-400/35 group-hover:text-purple-400 -rotate-90 transition-all shrink-0" />
            </Link>
          </AccordionSection>

          {/* 4. Statistics */}
          <AccordionSection title="Usage Statistics" color="#06b6d4"
            badge={stats ? `${stats.totalBookmarks} bookmarks · ${stats.totalCollections} collections` : "Loading…"}
            iconEl={<ClayBarIcon color="#0891b2" light="#67e8f9" size={38} />}>
            <div className="grid grid-cols-3 gap-2">
              <StatTile icon={Bookmark}     label="Bookmarks"   value={stats?.totalBookmarks || 0}    color="#6366f1" />
              <StatTile icon={FolderOpen}   label="Collections" value={stats?.totalCollections || 0}  color="#8b5cf6" />
              <StatTile icon={Tag}          label="Tags"        value={stats?.totalTags || 0}          color="#06b6d4" />
              <StatTile icon={Star}         label="Favourites"  value={stats?.totalFavorites || 0}     color="#f59e0b" />
              <StatTile icon={Archive}      label="Archived"    value={stats?.totalArchived || 0}      color="#64748b" />
              <StatTile icon={CalendarDays} label="This Month"  value={stats?.bookmarksThisMonth || 0} color="#10b981" />
            </div>
          </AccordionSection>

          {/* 5. Preferences */}
          <AccordionSection title="Preferences" color="#ec4899" badge={`Default view: ${defaultView}`}
            iconEl={<ClayIcon icon={Palette} color="#db2777" light="#f9a8d4" size={38} anim="breathe" animDelay={200} />}>
            <div>
              <label className="text-[9px] font-black text-white/25 block mb-2.5 uppercase tracking-widest">Default Bookmark View</label>
              <div className="flex gap-2">
                <ViewToggle value="grid" selected={defaultView==="grid"} onSelect={setDefaultView} icon={LayoutGrid} label="Grid" />
                <ViewToggle value="list" selected={defaultView==="list"} onSelect={setDefaultView} icon={List} label="List" />
              </div>
            </div>
          </AccordionSection>

          {/* 6. Keyboard Shortcuts */}
          <AccordionSection title="Keyboard Shortcuts" color="#10b981" badge="7 shortcuts"
            iconEl={<ClayIcon icon={Keyboard} color="#059669" light="#6ee7b7" size={38} animDelay={240} />}>
            <div>
              {[
                { key:"⌘K", label:"Open command palette" }, { key:"⌘N", label:"Add new bookmark" },
                { key:"⌘F", label:"Focus search" }, { key:"⌘J", label:"Toggle AI chat" },
                { key:"G → A", label:"Go to All Bookmarks" }, { key:"G → S", label:"Go to Settings" },
                { key:"Esc", label:"Close dialog / panel" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-[12px] text-white/45">{label}</span>
                  <kbd className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-lg font-mono font-bold"
                    style={{ background: "linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.03))", border: "1px solid rgba(255,255,255,.09)", color: "rgba(255,255,255,.5)", boxShadow: "0 2.5px 0 rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.07)" }}>
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 7. Security */}
          <AccordionSection title="Security" color="#f59e0b" badge="2FA coming soon"
            iconEl={<ClayIcon icon={Shield} color="#d97706" light="#fcd34d" size={38} anim="float" animDelay={280} />}>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.05]"
              style={{ background: "rgba(255,255,255,.015)" }}>
              <div className="flex items-center gap-3">
                <ClayDot icon={Zap} color="#d97706" light="#fcd34d" size={32} />
                <div>
                  <p className="text-[12.5px] font-black text-white/72">Two-factor authentication</p>
                  <p className="text-[10px] text-white/25 mt-0.5">Add extra security to your account</p>
                </div>
              </div>
              <span className="text-[9px] font-black px-2.5 py-1 rounded-full shrink-0"
                style={{ background: "rgba(245,158,11,.14)", color: "#fbbf24", border: "1px solid rgba(245,158,11,.25)" }}>
                Coming soon
              </span>
            </div>
          </AccordionSection>

        </div>
        <div className="h-10" />
      </div>
    </AppLayout>
  );
}
