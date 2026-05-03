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
  Pin, Clock, Globe,
} from "lucide-react";
import { clearAuthToken } from "@/lib/auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "./logo";
import { useBg } from "@/lib/background";
import { ClayIcon, ClayBarIcon, ClayDot } from "@/components/ui/clay-icon";

const COL_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b",
  "#ef4444","#06b6d4","#84cc16","#f97316","#14b8a6",
];

/* ─── Avatar ─────────────────────────────────────────────────── */
function nameToColor(name: string) {
  const p = ["#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b","#06b6d4","#f97316","#14b8a6"];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

function SidebarAvatarRow({ user }: { user: User }) {
  const color = nameToColor(user.name);
  const initials = user.name.split(" ").map((w: string) => w[0]).filter(Boolean).join("").substring(0, 2).toUpperCase();
  const light = _lighten(color);
  return (
    <div className="flex items-center gap-2.5 px-1 py-2 mb-1">
      <div className="relative shrink-0" style={{ width: 32, height: 32 }}>
        <div
          className="rounded-full flex items-center justify-center font-black text-white text-[11.5px] uppercase overflow-hidden relative"
          style={{
            width: 32, height: 32, letterSpacing: "-0.02em",
            background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,.88) 0%, ${light} 28%, ${color} 60%)`,
            boxShadow: `0 6px 18px ${color}50, 0 2px 5px rgba(0,0,0,.3), inset 0 -2px 6px rgba(0,0,0,.16), inset 0 2px 8px rgba(255,255,255,.55)`,
          }}>
          <span className="absolute" style={{ top: "10%", left: "12%", width: "32%", height: "22%", borderRadius: "50%", background: "radial-gradient(ellipse,rgba(255,255,255,.72) 0%,transparent 100%)", filter: "blur(1.5px)", zIndex: 2 }} />
          <span className="relative z-10 select-none">{initials}</span>
        </div>
        <span className="absolute bottom-0 right-0 rounded-full border-[2.5px]"
          style={{ width: 9, height: 9, borderColor: "rgba(9,9,15,.9)",
            background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,.6) 0%, #22c55e 55%)",
            boxShadow: "0 0 8px #22c55e90, inset 0 1px 2px rgba(255,255,255,.4)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-white/80 leading-none truncate">{user.name}</p>
        <p className="text-[10.5px] mt-0.5 truncate font-medium" style={{ color: `${color}88` }}>
          {user.isGuest ? "Guest session" : user.email}
        </p>
      </div>
    </div>
  );
}

interface AppSidebarProps { user: User; bgActive?: boolean; }

export function AppSidebar({ user, bgActive = false }: AppSidebarProps) {
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
    { href: "/app?view=favorites", label: "Favourites",    icon: Star,     color: "#f59e0b", count: stats?.totalFavorites, anim: "breathe" as const },
    { href: "/app?view=pinned",    label: "Pinned",        icon: Pin,      color: "#8b5cf6", count: null,                  anim: "wiggle"  as const },
    { href: "/app?view=archive",   label: "Archive",       icon: Archive,  color: "#64748b", count: stats?.totalArchived,  anim: "none"    as const },
  ];

  const discoverItems = [
    { href: "/analytics",        label: "Analytics",  icon: BarChart3, color: "#06b6d4", bar: true  },
    { href: "/app?view=recent",  label: "Recent",     icon: Clock,     color: "#f97316", bar: false },
    { href: "/app?view=domains", label: "By Domain",  icon: Globe,     color: "#3b82f6", bar: false },
  ];

  return (
    <Sidebar
      className="border-r border-white/[0.06] w-[220px] shrink-0"
      style={bgActive
        ? { background: "rgba(7,7,14,.8)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }
        : { background: "#09090f" }
      }
    >
      <SidebarHeader className="px-4 py-4 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={28} />
          <span className="font-black text-[15px] text-white tracking-tight group-hover:text-indigo-200 transition-colors">
            Link Haven
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-0 overflow-y-auto">

        {/* Library */}
        <SidebarGroup className="mb-3">
          <p className="text-[9.5px] font-black text-white/18 uppercase tracking-[0.15em] px-2 mb-2">Library</p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-[3px]">
              {libraryItems.map(({ href, label, icon, color, count, anim }) => {
                const active = isActive(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active}
                      className="rounded-xl h-9 px-2 text-[12.5px] transition-all"
                      style={active ? {
                        background: `linear-gradient(100deg, ${color}1a 0%, transparent 70%)`,
                        borderRight: `2px solid ${color}60`,
                      } : {}}>
                      <Link href={href} className="flex items-center gap-2.5">
                        <ClayIcon icon={icon} color={color} size={26} active={active} anim={active ? anim : "none"} />
                        <span className={`flex-1 truncate font-semibold ${active ? "text-white" : "text-white/55"}`}>{label}</span>
                        {count != null && (
                          <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-md font-bold"
                            style={{ background: active ? `${color}25` : "rgba(255,255,255,.05)", color: active ? color : "rgba(255,255,255,.25)" }}>
                            {count}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Discover */}
        <SidebarGroup className="mb-3">
          <p className="text-[9.5px] font-black text-white/18 uppercase tracking-[0.15em] px-2 mb-2">Discover</p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-[3px]">
              {discoverItems.map(({ href, label, icon, color, bar }) => {
                const active = isActive(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active}
                      className="rounded-xl h-9 px-2 text-[12.5px] transition-all"
                      style={active ? {
                        background: `linear-gradient(100deg, ${color}1a 0%, transparent 70%)`,
                        borderRight: `2px solid ${color}60`,
                      } : {}}>
                      <Link href={href} className="flex items-center gap-2.5">
                        {bar
                          ? <ClayBarIcon color={color} size={26} />
                          : <ClayIcon icon={icon} color={color} size={26} active={active} anim={active ? "breathe" : "none"} />
                        }
                        <span className={`flex-1 truncate font-semibold ${active ? "text-white" : "text-white/55"}`}>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collections */}
        <SidebarGroup className="mb-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <button
              className="flex items-center gap-1 text-[9.5px] font-black text-white/18 uppercase tracking-[0.15em] hover:text-white/40 transition-colors"
              onClick={() => setColsOpen(v => !v)}>
              {colsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Collections
            </button>
            <button onClick={() => setShowNewCol(v => !v)} title="New collection"
              className="text-white/20 hover:text-white/55 transition-all p-0.5 hover:scale-110 hover:rotate-12">
              <FolderPlus className="size-3.5" />
            </button>
          </div>

          {showNewCol && (
            <form onSubmit={handleCreateCol} className="px-2 mb-2">
              <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => e.key === "Escape" && setShowNewCol(false)}
                placeholder="Collection name…"
                className="w-full text-[12px] bg-white/[0.06] border border-white/10 rounded-xl px-2.5 py-1.5 text-white/80 placeholder:text-white/20 outline-none focus:border-indigo-500/40"
              />
            </form>
          )}

          {colsOpen && (
            <SidebarGroupContent>
              <SidebarMenu className="gap-[3px]">
                {(collections as Collection[] | undefined)?.map((col: Collection, i: number) => {
                  const cc = col.color || COL_COLORS[i % COL_COLORS.length];
                  const active = location === `/app/collection/${col.id}`;
                  return (
                    <SidebarMenuItem key={col.id}>
                      <SidebarMenuButton asChild isActive={active}
                        className="rounded-xl h-8 px-2 text-[12.5px] transition-all"
                        style={active ? { background: `linear-gradient(100deg, ${cc}18 0%, transparent 70%)`, borderRight: `2px solid ${cc}50` } : {}}>
                        <Link href={`/app/collection/${col.id}`} className="flex items-center gap-2.5">
                          {col.icon ? (
                            <span className="text-[14px] leading-none">{col.icon}</span>
                          ) : (
                            <ClayDot icon={Archive} color={cc} size={20} />
                          )}
                          <span className={`flex-1 truncate ${active ? "text-white font-semibold" : "text-white/50"}`}>{col.name}</span>
                          <span className="text-[10px] tabular-nums" style={{ color: active ? cc + "99" : "rgba(255,255,255,.2)" }}>
                            {(col as any).bookmarkCount}
                          </span>
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
            <button className="flex items-center gap-1 px-2 mb-2 text-[9.5px] font-black text-white/18 uppercase tracking-[0.15em] hover:text-white/40 transition-colors"
              onClick={() => setTagsOpen(v => !v)}>
              {tagsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Tags
            </button>
            {tagsOpen && (
              <div className="px-2 flex flex-wrap gap-1.5 pb-2">
                {(tags as any[]).slice(0, 25).map((tag: any) => {
                  const active = qs === `?tag=${tag.name}`;
                  return (
                    <Link key={tag.name} href={`/app?tag=${tag.name}`}>
                      <span className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] border cursor-pointer transition-all hover:scale-105 font-medium ${
                        active
                          ? "bg-indigo-500/18 border-indigo-500/35 text-indigo-300"
                          : "bg-white/[0.04] border-white/[0.06] text-white/32 hover:text-white/60 hover:border-white/[0.12]"
                      }`}>
                        <Hash className="size-2.5" />{tag.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-white/[0.06] p-3">
        <SidebarAvatarRow user={user} />
        <SidebarMenu className="gap-[3px]">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/settings"}
              className="rounded-xl h-9 px-2 text-[12.5px] transition-all"
              style={location === "/settings" ? { background: "linear-gradient(100deg, rgba(100,116,139,.18) 0%, transparent 70%)", borderRight: "2px solid rgba(100,116,139,.4)" } : {}}>
              <Link href="/settings" className="flex items-center gap-2.5">
                <ClayIcon icon={Settings} color="#64748b" light="#94a3b8" size={26} active={location === "/settings"} anim={location === "/settings" ? "spin" : "none"} />
                <span className={`font-semibold ${location === "/settings" ? "text-white" : "text-white/45"}`}>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="rounded-xl h-9 px-2 text-[12.5px] text-white/35 hover:text-red-400 hover:bg-red-500/[0.06] group/lo transition-all">
              <span className="flex items-center gap-2.5 w-full">
                <ClayIcon icon={LogOut} color="#ef4444" light="#fca5a5" size={26} />
                <span className="group-hover/lo:text-red-400 transition-colors">Sign out</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function _lighten(hex: string): string {
  const m = hex.replace("#","").match(/.{2}/g);
  if (!m || m.length < 3) return hex + "99";
  const [r,g,b] = m.map(c => parseInt(c,16));
  const mix = (v: number) => Math.round(v + (255 - v) * 0.42).toString(16).padStart(2,"0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}
