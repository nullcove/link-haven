import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, getGetMeQueryKey, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  Settings, User, BarChart3, Keyboard, Palette, Bot,
  ChevronRight, Bookmark, FolderOpen, Tag, Star, Archive,
  Sparkles, CalendarDays, Shield, Mail, UserCircle2,
  LayoutGrid, List, Zap,
} from "lucide-react";
import { Link } from "wouter";

/* ─── 3D icon box ─────────────────────────────────────────── */
function Icon3D({ icon: Ic, color, size = 38 }: { icon: React.ElementType; color: string; size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <span
      className="flex items-center justify-center shrink-0 relative"
      style={{
        width: size, height: size,
        borderRadius: r,
        background: `linear-gradient(145deg, ${color}40, ${color}16)`,
        border: `1.5px solid ${color}35`,
        boxShadow: `0 4px 14px ${color}28, 0 1px 0 ${color}20, inset 0 1.5px 0 rgba(255,255,255,.12), inset 0 -1.5px 0 rgba(0,0,0,.18)`,
      }}
    >
      {/* Top shine */}
      <span className="absolute inset-0 pointer-events-none" style={{
        borderRadius: r,
        background: `linear-gradient(175deg, rgba(255,255,255,.13) 0%, transparent 55%)`,
      }} />
      <Ic style={{ width: size * 0.48, height: size * 0.48, color, strokeWidth: 1.75 }} />
    </span>
  );
}

/* ─── Section card ────────────────────────────────────────── */
function Section({ icon, color, title, description, children }: {
  icon: React.ElementType; color: string; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
      style={{ background: "linear-gradient(145deg,#121218,#0e0e16)", boxShadow: "0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)" }}>
      {/* Card header */}
      <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-white/[0.05]"
        style={{ background: `linear-gradient(90deg, ${color}0a, transparent 60%)` }}>
        <Icon3D icon={icon} color={color} size={40} />
        <div>
          <h2 className="text-[14px] font-bold text-white leading-none">{title}</h2>
          {description && <p className="text-[11.5px] text-white/35 mt-1">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─── Stat tile ───────────────────────────────────────────── */
function StatTile({ icon: Ic, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-white/[0.06] p-4 flex flex-col gap-2.5"
      style={{ background: "linear-gradient(145deg,rgba(255,255,255,.03),rgba(255,255,255,.01))" }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${color}60, transparent)` }} />
      <span className="flex items-center justify-between">
        <span className="size-[28px] flex items-center justify-center rounded-[8px]"
          style={{ background: `linear-gradient(145deg,${color}30,${color}10)`, border: `1px solid ${color}25`, boxShadow: `0 1px 6px ${color}18, inset 0 1px 0 rgba(255,255,255,.07)` }}>
          <Ic style={{ width: 13, height: 13, color, strokeWidth: 2 }} />
        </span>
      </span>
      <span className="text-[26px] font-black leading-none" style={{ color }}>{value.toLocaleString()}</span>
      <span className="text-[11px] text-white/35 font-medium leading-none">{label}</span>
    </div>
  );
}

/* ─── AI provider logo ────────────────────────────────────── */
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
const COLORS: Record<string, string> = {
  OpenAI:"#10a37f",Anthropic:"#d97706",Gemini:"#4285f4",Mistral:"#f97316",Groq:"#7c3aed",
  Perplexity:"#06b6d4",Cohere:"#14b8a6",OpenRouter:"#6366f1",Together:"#10b981",Ollama:"#e879f9",
};

function AIModelsSection() {
  const providers = ["OpenAI","Anthropic","Gemini","Mistral","Groq","Perplexity","Cohere","OpenRouter","Together","Ollama"];
  return (
    <Section icon={Bot} color="#a855f7" title="AI Models" description="Connect cloud APIs or your local Ollama GPU instance">
      <div className="grid grid-cols-5 gap-2 mb-4">
        {providers.map(p => (
          <div key={p} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all group cursor-default"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="size-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(145deg, ${COLORS[p]}25, ${COLORS[p]}0e)`, border: `1px solid ${COLORS[p]}28`, boxShadow: `0 2px 8px ${COLORS[p]}18, inset 0 1px 0 rgba(255,255,255,.07)` }}>
              <img src={LOGOS[p]} alt={p} width={20} height={20} className="object-contain" onError={e => (e.target as HTMLImageElement).style.display="none"} draggable={false} />
            </span>
            <span className="text-[9px] font-semibold text-white/35 group-hover:text-white/60 transition-colors leading-none text-center">{p}</span>
          </div>
        ))}
      </div>
      <Link href="/ai-settings"
        className="flex items-center justify-between w-full p-3.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/35 transition-all group"
        style={{ background: "linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.06))", boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" }}>
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-indigo-400" />
          <span className="text-[13px] font-semibold text-indigo-300 group-hover:text-indigo-200">Manage AI providers &amp; API keys</span>
        </div>
        <ChevronRight className="size-4 text-indigo-400/50 group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5" />
      </Link>
    </Section>
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });

  return (
    <AppLayout>
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-white/[0.055] flex items-center gap-3 px-6 sticky top-0 z-10"
        style={{ background: "rgba(9,9,15,.85)", backdropFilter: "blur(20px)" }}>
        <Icon3D icon={Settings} color="#94a3b8" size={28} />
        <div>
          <h1 className="font-black text-[15px] text-white leading-none">Settings</h1>
          <p className="text-[10px] text-white/25 mt-px">Account &amp; preferences</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: "#08080e" }}>
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Profile */}
          <Section icon={UserCircle2} color="#6366f1" title="Profile" description="Your account information">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="size-16 rounded-full flex items-center justify-center text-[20px] font-black text-indigo-200 uppercase"
                  style={{ background: "linear-gradient(145deg,rgba(99,102,241,.4),rgba(139,92,246,.2))", border: "2px solid rgba(99,102,241,.35)", boxShadow: "0 4px 16px rgba(99,102,241,.25), inset 0 1.5px 0 rgba(255,255,255,.12)" }}>
                  {user?.name?.substring(0, 2)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full border-2 border-[#08080e] flex items-center justify-center"
                  style={{ background: "linear-gradient(145deg,#10b981,#059669)", boxShadow: "0 1px 4px rgba(16,185,129,.4)" }}>
                  <span className="size-1.5 rounded-full bg-white/80" />
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-white">{user?.name}</h3>
                <p className="text-[12px] text-white/35 mt-0.5 flex items-center gap-1.5">
                  <Mail className="size-3" />{user?.isGuest ? "Guest session" : user?.email}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: user?.isGuest ? "rgba(100,116,139,.18)" : "rgba(99,102,241,.18)", color: user?.isGuest ? "#94a3b8" : "#a5b4fc", border: `1px solid ${user?.isGuest ? "rgba(100,116,139,.25)" : "rgba(99,102,241,.3)"}` }}>
                  {user?.isGuest ? "👤 Guest" : "✦ Pro Member"}
                </span>
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="text-[11px] font-semibold text-white/35 block mb-1.5">Display Name</label>
                <input defaultValue={user?.name} disabled={user?.isGuest}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-white/70 outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-white/35 block mb-1.5">Email</label>
                <input defaultValue={user?.isGuest ? "Guest session" : user?.email} disabled
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-white/30 outline-none"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1.5px solid rgba(255,255,255,0.05)" }} />
              </div>
            </div>
            {user && !user.isGuest && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-white/25">
                <CalendarDays className="size-3" />
                Member since {format(new Date(user.createdAt), "MMMM yyyy")}
              </div>
            )}
          </Section>

          {/* AI Models */}
          <AIModelsSection />

          {/* Stats */}
          <Section icon={BarChart3} color="#06b6d4" title="Usage Statistics" description={user ? `Member since ${format(new Date(user.createdAt), "MMMM yyyy")}` : undefined}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatTile icon={Bookmark}     label="Total Bookmarks"  value={stats?.totalBookmarks || 0}     color="#6366f1" />
              <StatTile icon={FolderOpen}   label="Collections"      value={stats?.totalCollections || 0}   color="#8b5cf6" />
              <StatTile icon={Tag}          label="Tags"             value={stats?.totalTags || 0}           color="#06b6d4" />
              <StatTile icon={Star}         label="Favourites"       value={stats?.totalFavorites || 0}      color="#f59e0b" />
              <StatTile icon={Archive}      label="Archived"         value={stats?.totalArchived || 0}       color="#64748b" />
              <StatTile icon={CalendarDays} label="This Month"       value={stats?.bookmarksThisMonth || 0}  color="#10b981" />
            </div>
          </Section>

          {/* Preferences */}
          <Section icon={Palette} color="#ec4899" title="Preferences">
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-white/35 block mb-2">Default View</label>
                <div className="flex gap-2">
                  {[
                    { v: "grid", l: "Grid View", icon: LayoutGrid },
                    { v: "list", l: "List View", icon: List },
                  ].map(({ v, l, icon: Ic }) => (
                    <button key={v}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-medium border transition-all hover:border-white/15"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                      <Ic className="size-3.5" />{l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Keyboard shortcuts */}
          <Section icon={Keyboard} color="#10b981" title="Keyboard Shortcuts">
            <div className="space-y-0.5">
              {[
                { key: "⌘K",     label: "Open command palette" },
                { key: "⌘N",     label: "Add new bookmark" },
                { key: "⌘F",     label: "Focus search" },
                { key: "⌘J",     label: "Toggle AI chat" },
                { key: "G → A",  label: "Go to All Bookmarks" },
                { key: "G → S",  label: "Go to Settings" },
                { key: "Esc",    label: "Close dialog / panel" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-[12.5px] text-white/50">{label}</span>
                  <kbd className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-mono"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", boxShadow: "0 1px 0 rgba(255,255,255,0.04), inset 0 1px 2px rgba(0,0,0,.3)" }}>
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </Section>

          {/* Security */}
          <Section icon={Shield} color="#f59e0b" title="Security">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06]"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-3">
                  <span className="size-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(145deg,rgba(245,158,11,.25),rgba(245,158,11,.1))", border: "1px solid rgba(245,158,11,.25)" }}>
                    <Zap className="size-4 text-amber-400" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-white/75">Two-factor authentication</p>
                    <p className="text-[11px] text-white/30 mt-px">Add extra security to your account</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-400/20">Coming soon</span>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </AppLayout>
  );
}
