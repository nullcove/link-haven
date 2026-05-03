import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { User, Collection } from "@workspace/api-client-react";
import {
  useListCollections, getListCollectionsQueryKey,
  useListTags, getListTagsQueryKey,
  useGetStats, getGetStatsQueryKey,
  useLogout, useCreateCollection,
} from "@workspace/api-client-react";
import {
  Bookmark, Hash, LogOut, Settings, Star, Archive,
  FolderPlus, ChevronDown, ChevronRight, BarChart3,
  Brain, Pin, Clock, Globe, Sparkles,
} from "lucide-react";
import { clearAuthToken } from "@/lib/auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "./logo";
import { useBg } from "@/lib/background";

const COL_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b",
  "#ef4444","#06b6d4","#84cc16","#f97316","#14b8a6",
];

/* ─── Animation CSS ─────────────────────────────────────────── */
const ICON_CSS = `
@keyframes _ni-float  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-3.5px)} }
@keyframes _ni-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes _ni-twinkle{ 0%,100%{opacity:1;filter:brightness(1) drop-shadow(0 0 3px currentColor)}
                        45%{opacity:.6;filter:brightness(.7)}
                        50%{opacity:1;filter:brightness(2.2) drop-shadow(0 0 7px currentColor)}
                        55%{opacity:.7;filter:brightness(.8)} }
@keyframes _ni-breathe{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
@keyframes _ni-wiggle { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-16deg)} 40%{transform:rotate(14deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(8deg)} }
@keyframes _ni-ring   { 0%{transform:scale(1);opacity:.55} 100%{transform:scale(2.4);opacity:0} }
@keyframes _ni-ring2  { 0%{transform:scale(1);opacity:.35} 100%{transform:scale(2.8);opacity:0} }
@keyframes _ni-bar    { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.4)} }
@keyframes _ni-shd    { 0%{transform:translateX(-120%)} 100%{transform:translateX(120%)} }
@keyframes _ni-globe  { from{transform:rotateY(0)} to{transform:rotateY(360deg)} }
@keyframes _ni-logout { 0%{transform:translateX(0)} 100%{transform:translateX(5px)} }
@keyframes _ni-popIn  { 0%{transform:scale(.55);opacity:0} 65%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }

._ni-float   { animation: _ni-float   2.6s ease-in-out infinite; }
._ni-spin    { animation: _ni-spin    7s   linear     infinite; }
._ni-twinkle { animation: _ni-twinkle 2.4s ease-in-out infinite; }
._ni-breathe { animation: _ni-breathe 2.8s ease-in-out infinite; }
._ni-wiggle  { animation: _ni-wiggle  .6s  ease-in-out; }
._ni-popIn   { animation: _ni-popIn   .35s cubic-bezier(.22,1,.36,1) both; }
._ni-logout  { animation: _ni-logout  .5s  ease-in-out infinite alternate; }

._ni-box {
  transition: transform .18s cubic-bezier(.22,1,.36,1), box-shadow .18s ease, filter .18s ease;
}
._ni-box:hover {
  transform: scale(1.18) translateY(-1px) !important;
  filter: brightness(1.15);
}
/* active nav item icon glow */
[data-active="true"] ._ni-box {
  filter: brightness(1.15) saturate(1.2);
}
`;

/* ─── 3D Icon chip component ───────────────────────────────── */
function NavIcon3D({
  icon: Ic,
  color,
  active = false,
  anim = "none",
  size = 25,
}: {
  icon: React.ElementType;
  color: string;
  active?: boolean;
  anim?: "float" | "spin" | "twinkle" | "breathe" | "wiggle" | "logout" | "none";
  size?: number;
}) {
  const r = Math.round(size * 0.34);
  const iconAnim = active
    ? anim !== "none"
      ? `_ni-${anim}`
      : ""
    : "";

  return (
    <span
      className="_ni-box relative flex items-center justify-center shrink-0"
      data-ni-active={active}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        /* multi-layer 3D gradient */
        background: `
          radial-gradient(circle at 32% 28%, ${color}60 0%, transparent 58%),
          linear-gradient(145deg, ${color}42 0%, ${color}1a 100%)
        `,
        border: `1px solid ${color}45`,
        boxShadow: active
          ? `0 0 0 1.5px ${color}35, 0 4px 16px ${color}45, 0 2px 6px ${color}30,
             inset 0 2px 0 rgba(255,255,255,.18), inset 0 -1.5px 0 rgba(0,0,0,.22)`
          : `0 2px 8px ${color}28, 0 1px 3px ${color}18,
             inset 0 2px 0 rgba(255,255,255,.13), inset 0 -1.5px 0 rgba(0,0,0,.18)`,
      }}
    >
      {/* Top specular shine */}
      <span
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ borderRadius: r, background: "linear-gradient(138deg, rgba(255,255,255,.22) 0%, transparent 48%)" }}
      />

      {/* Active pulsing ring */}
      {active && (
        <>
          <span className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: r, border: `1.5px solid ${color}65`, animation: "_ni-ring 2s ease-out infinite" }} />
          <span className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: r, border: `1px solid ${color}40`, animation: "_ni-ring2 2s ease-out .6s infinite" }} />
        </>
      )}

      {/* The icon itself */}
      <Ic
        className={iconAnim}
        style={{
          width: size * 0.5,
          height: size * 0.5,
          color: active ? "#fff" : color,
          strokeWidth: 2,
          filter: active
            ? `drop-shadow(0 1px 4px ${color}80) drop-shadow(0 0 8px ${color}50)`
            : `drop-shadow(0 1px 2px ${color}55)`,
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}
      />

      {/* Active shimmer sweep */}
      {active && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: r,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.18) 50%, transparent 100%)",
            animation: "_ni-shd 2.4s ease-in-out infinite",
            width: "40%",
            transform: "translateX(-120%)",
          }}
        />
      )}
    </span>
  );
}

/* ─── Avatar color from name hash ───────────────────────────── */
function nameToColor(name: string) {
  const palette = ["#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b","#06b6d4","#f97316","#14b8a6"];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

/* ─── Sidebar avatar row ─────────────────────────────────────── */
function SidebarAvatarRow({ user }: { user: User }) {
  const color = nameToColor(user.name);
  const initials = user.name.split(" ").map((w: string) => w[0]).filter(Boolean).join("").substring(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-1 py-2 mb-1">
      <div className="relative shrink-0" style={{ width: 32, height: 32 }}>
        <div className="rounded-full flex items-center justify-center font-black text-white text-[11.5px] uppercase overflow-hidden relative"
          style={{
            width: 32, height: 32, letterSpacing: "-0.02em",
            background: `radial-gradient(circle at 32% 28%, ${color}ee 0%, ${color}55 60%, ${color}22 100%)`,
            border: `2px solid ${color}55`,
            boxShadow: `0 3px 12px ${color}40, inset 0 2px 0 rgba(255,255,255,.2), inset 0 -1.5px 0 rgba(0,0,0,.18)`,
          }}>
          <span className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(145deg, rgba(255,255,255,.25) 0%, transparent 50%)" }} />
          <span className="relative z-10 select-none">{initials}</span>
        </div>
        <span className="absolute bottom-0 right-0 rounded-full border-2"
          style={{ width: 9, height: 9, borderColor: "rgba(9,9,15,.95)", background: "#34d399", boxShadow: "0 0 6px #34d39990" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-white/80 leading-none truncate">{user.name}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: `${color}99` }}>
          {user.isGuest ? "Guest session" : user.email}
        </p>
      </div>
    </div>
  );
}

interface AppSidebarProps { user: User; onOpenGemini?: () => void; bgActive?: boolean; }

export function AppSidebar({ user, onOpenGemini, bgActive = false }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [newColName, setNewColName] = useState("");
  const [showNewCol, setShowNewCol] = useState(false);
  const [colsOpen, setColsOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);

  const { data: collections } = useListCollections({ query: { queryKey: getListCollectionsQueryKey() } });
  const { data: tags } = useListTags({ query: { queryKey: getListTagsQueryKey() } });
  const { data: stats } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });
  const logoutMutation = useLogout();
  const createColMutation = useCreateCollection();

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    clearAuthToken(); setLocation("/");
  };

  const handleCreateCol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await createColMutation.mutateAsync({ data: { name: newColName.trim() } });
    queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
    setNewColName(""); setShowNewCol(false);
  };

  const qs = typeof window !== "undefined" ? window.location.search : "";
  const isActive = (href: string) => {
    if (href.includes("?")) return qs === href.slice(href.indexOf("?")) && location === "/app";
    return location === href && !qs;
  };

  const libraryItems = [
    { href: "/app",                label: "All Bookmarks", icon: Bookmark, color: "#6366f1", count: stats?.totalBookmarks, anim: "float"   as const },
    { href: "/app?view=favorites", label: "Favourites",    icon: Star,     color: "#f59e0b", count: stats?.totalFavorites, anim: "twinkle" as const },
    { href: "/app?view=pinned",    label: "Pinned",        icon: Pin,      color: "#8b5cf6", count: null,                  anim: "wiggle"  as const },
    { href: "/app?view=archive",   label: "Archive",       icon: Archive,  color: "#64748b", count: stats?.totalArchived,  anim: "none"    as const },
  ];

  const discoverItems = [
    { href: "/analytics",       label: "Analytics",  icon: BarChart3, color: "#06b6d4", anim: "breathe" as const },
    { href: "/app?view=recent", label: "Recent",     icon: Clock,     color: "#f97316", anim: "none"    as const },
    { href: "/app?view=domains",label: "By Domain",  icon: Globe,     color: "#3b82f6", anim: "spin"    as const },
  ];

  return (
    <Sidebar
      className="border-r border-white/[0.06] w-[220px] shrink-0"
      style={bgActive
        ? { background: "rgba(7,7,14,.78)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }
        : { background: "#09090f" }
      }
    >
      <style dangerouslySetInnerHTML={{ __html: ICON_CSS }} />

      <SidebarHeader className="px-4 py-4 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={28} />
          <span className="font-bold text-[15px] text-white tracking-tight group-hover:text-indigo-200 transition-colors">
            Link Haven
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-0 overflow-y-auto">

        {/* Library */}
        <SidebarGroup className="mb-4">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] px-2 mb-1.5">Library</p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {libraryItems.map(({ href, label, icon, color, count, anim }) => {
                const active = isActive(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active} className="rounded-lg h-8 px-2 text-[13px]">
                      <Link href={href} className="flex items-center gap-2.5" data-active={active}>
                        <NavIcon3D icon={icon} color={color} active={active} anim={anim} />
                        <span className="flex-1 truncate">{label}</span>
                        {count != null && <span className="text-[11px] tabular-nums opacity-40">{count}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Discover */}
        <SidebarGroup className="mb-4">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] px-2 mb-1.5">Discover</p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {discoverItems.map(({ href, label, icon, color, anim }) => {
                const active = isActive(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active} className="rounded-lg h-8 px-2 text-[13px]">
                      <Link href={href} className="flex items-center gap-2.5" data-active={active}>
                        <NavIcon3D icon={icon} color={color} active={active} anim={anim} />
                        <span className="flex-1 truncate">{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Assistant */}
        {onOpenGemini && (
          <SidebarGroup className="mb-4">
            <button
              onClick={onOpenGemini}
              className="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl transition-all group"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,.1) 0%, rgba(139,92,246,.06) 100%)",
                border: "1px solid rgba(99,102,241,.22)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,102,241,.18) 0%, rgba(139,92,246,.12) 100%)")}
              onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,102,241,.1) 0%, rgba(139,92,246,.06) 100%)")}
            >
              <NavIcon3D icon={Brain} color="#a78bfa" active anim="breathe" size={25} />
              <span className="text-[12px] font-semibold text-indigo-300 group-hover:text-indigo-200 flex-1 text-left">AI Assistant</span>
              <Sparkles className="size-3 text-indigo-400/50 group-hover:text-indigo-400 transition-colors" />
            </button>
          </SidebarGroup>
        )}

        {/* Collections */}
        <SidebarGroup className="mb-4">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <button
              className="flex items-center gap-1 text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] hover:text-white/40 transition-colors"
              onClick={() => setColsOpen(v => !v)}>
              {colsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Collections
            </button>
            <button onClick={() => setShowNewCol(v => !v)} title="New collection"
              className="text-white/20 hover:text-white/55 transition-colors p-0.5 hover:scale-110">
              <FolderPlus className="size-3.5" />
            </button>
          </div>

          {showNewCol && (
            <form onSubmit={handleCreateCol} className="px-2 mb-2">
              <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => e.key === "Escape" && setShowNewCol(false)}
                placeholder="Collection name…"
                className="w-full text-[12px] bg-white/[0.06] border border-white/10 rounded-md px-2.5 py-1.5 text-white/80 placeholder:text-white/20 outline-none focus:border-indigo-500/40"
              />
            </form>
          )}

          {colsOpen && (
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {(collections as Collection[] | undefined)?.map((col: Collection, i: number) => {
                  const cc = col.color || COL_COLORS[i % COL_COLORS.length];
                  return (
                    <SidebarMenuItem key={col.id}>
                      <SidebarMenuButton asChild isActive={location === `/app/collection/${col.id}`} className="rounded-lg h-8 px-2 text-[13px]">
                        <Link href={`/app/collection/${col.id}`} className="flex items-center gap-2.5">
                          {col.icon ? (
                            <span className="text-[13px] leading-none">{col.icon}</span>
                          ) : (
                            <span className="_ni-box flex items-center justify-center shrink-0 rounded-[8px]"
                              style={{
                                width: 20, height: 20,
                                background: `radial-gradient(circle at 30% 30%, ${cc}55, transparent 60%), linear-gradient(145deg, ${cc}35, ${cc}14)`,
                                border: `1px solid ${cc}35`,
                                boxShadow: `0 2px 6px ${cc}22, inset 0 1px 0 rgba(255,255,255,.1)`,
                              }}>
                              <span className="size-1.5 rounded-full" style={{ backgroundColor: cc, boxShadow: `0 0 4px ${cc}` }} />
                            </span>
                          )}
                          <span className="flex-1 truncate">{col.name}</span>
                          <span className="text-[11px] tabular-nums opacity-40">{(col as any).bookmarkCount}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Tags */}
        {tags && (tags as any[]).length > 0 && (
          <SidebarGroup>
            <button className="flex items-center gap-1 px-2 mb-2 text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] hover:text-white/40 transition-colors"
              onClick={() => setTagsOpen(v => !v)}>
              {tagsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Tags
            </button>
            {tagsOpen && (
              <div className="px-2 flex flex-wrap gap-1 pb-2">
                {(tags as any[]).slice(0, 25).map((tag: any) => (
                  <Link key={tag.name} href={`/app?tag=${tag.name}`}>
                    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] border cursor-pointer transition-all hover:scale-105 ${
                      qs === `?tag=${tag.name}`
                        ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                        : "bg-white/[0.04] border-white/[0.06] text-white/35 hover:text-white/60"
                    }`}>
                      <Hash className="size-2.5" />{tag.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-white/[0.06] p-3">
        {/* Avatar row */}
        <SidebarAvatarRow user={user} />

        <SidebarMenu className="gap-0.5">
          {[
            { href: "/settings", icon: Settings, color: "#94a3b8", label: "Settings", anim: "spin" as const, labelColor: "text-white/55" },
          ].map(({ href, icon, color, label, anim, labelColor }) => {
            const active = location === href;
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={active} className="rounded-lg h-8 px-2 text-[13px]">
                  <Link href={href} className="flex items-center gap-2.5">
                    <NavIcon3D icon={icon} color={color} active={active} anim={anim} />
                    <span className={labelColor}>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="rounded-lg h-8 px-2 text-[13px] text-white/35 hover:text-red-400 hover:bg-red-500/[0.06] group/lo">
              <span className="flex items-center gap-2.5 w-full">
                <span className="_ni-box relative flex items-center justify-center shrink-0 rounded-[8px]"
                  style={{
                    width: 25, height: 25,
                    background: "radial-gradient(circle at 32% 28%, rgba(239,68,68,.45), transparent 58%), linear-gradient(145deg, rgba(239,68,68,.35), rgba(239,68,68,.12))",
                    border: "1px solid rgba(239,68,68,.38)",
                    boxShadow: "0 2px 8px rgba(239,68,68,.22), inset 0 2px 0 rgba(255,255,255,.1), inset 0 -1.5px 0 rgba(0,0,0,.18)",
                  }}>
                  <span className="absolute inset-0 rounded-[8px]" style={{ background: "linear-gradient(138deg, rgba(255,255,255,.18) 0%, transparent 48%)" }} />
                  <LogOut
                    style={{ width: 12, height: 12, color: "#f87171", filter: "drop-shadow(0 1px 2px rgba(239,68,68,.55))", position: "relative", zIndex: 1 }}
                    strokeWidth={2} />
                </span>
                Sign out
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
