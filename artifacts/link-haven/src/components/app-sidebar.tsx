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
  Brain, Pin, Clock, Globe, Sparkles, Bot,
} from "lucide-react";
import { clearAuthToken } from "@/lib/auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "./logo";

const COL_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b",
  "#ef4444","#06b6d4","#84cc16","#f97316","#14b8a6",
];

/* ─── 3D nav icon chip ─────────────────────────────────────── */
function NavIcon({ icon: Icon, color, size = 20 }: { icon: React.ElementType; color: string; size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0 rounded-[7px]"
      style={{
        width: size, height: size,
        background: `linear-gradient(145deg, ${color}38, ${color}14)`,
        border: `1px solid ${color}30`,
        boxShadow: `0 1px 6px ${color}22, 0 0 0 0.5px ${color}18, inset 0 1px 0 rgba(255,255,255,.09), inset 0 -1px 0 rgba(0,0,0,.15)`,
      }}
    >
      <Icon style={{ width: size * 0.54, height: size * 0.54, color, strokeWidth: 2 }} />
    </span>
  );
}

interface AppSidebarProps { user: User; onOpenGemini?: () => void; }

export function AppSidebar({ user, onOpenGemini }: AppSidebarProps) {
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
    { href: "/app",                label: "All Bookmarks", icon: Bookmark, color: "#6366f1", count: stats?.totalBookmarks },
    { href: "/app?view=favorites", label: "Favourites",    icon: Star,     color: "#f59e0b", count: stats?.totalFavorites },
    { href: "/app?view=pinned",    label: "Pinned",        icon: Pin,      color: "#8b5cf6", count: null },
    { href: "/app?view=archive",   label: "Archive",       icon: Archive,  color: "#64748b", count: stats?.totalArchived },
  ];

  const discoverItems = [
    { href: "/analytics",          label: "Analytics",    icon: BarChart3, color: "#06b6d4" },
    { href: "/app?view=recent",    label: "Recent",       icon: Clock,     color: "#f97316" },
    { href: "/app?view=domains",   label: "By Domain",    icon: Globe,     color: "#3b82f6" },
  ];

  return (
    <Sidebar className="border-r border-white/[0.06] bg-[#09090f] w-[220px] shrink-0">
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
              {libraryItems.map(({ href, label, icon, color, count }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={isActive(href)} className="rounded-lg h-8 px-2 text-[13px]">
                    <Link href={href} className="flex items-center gap-2.5">
                      <NavIcon icon={icon} color={color} />
                      <span className="flex-1 truncate">{label}</span>
                      {count != null && <span className="text-[11px] tabular-nums opacity-40">{count}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Discover */}
        <SidebarGroup className="mb-4">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] px-2 mb-1.5">Discover</p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {discoverItems.map(({ href, label, icon, color }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={isActive(href)} className="rounded-lg h-8 px-2 text-[13px]">
                    <Link href={href} className="flex items-center gap-2.5">
                      <NavIcon icon={icon} color={color} />
                      <span className="flex-1 truncate">{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Assistant */}
        {onOpenGemini && (
          <SidebarGroup className="mb-4">
            <button
              onClick={onOpenGemini}
              className="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/[0.12] to-violet-600/[0.08] border border-indigo-500/20 hover:from-indigo-600/[0.22] hover:border-indigo-500/35 transition-all group"
            >
              <div className="size-[22px] rounded-[7px] flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(145deg,rgba(139,92,246,.4),rgba(99,102,241,.2))", border: "1px solid rgba(139,92,246,.35)", boxShadow: "0 1px 6px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.1), inset 0 -1px 0 rgba(0,0,0,.2)" }}>
                <Brain className="size-3 text-violet-300" strokeWidth={2} />
              </div>
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
              onClick={() => setColsOpen(v => !v)}
            >
              {colsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Collections
            </button>
            <button onClick={() => setShowNewCol(v => !v)} title="New collection" className="text-white/20 hover:text-white/50 transition-colors p-0.5">
              <FolderPlus className="size-3.5" />
            </button>
          </div>

          {showNewCol && (
            <form onSubmit={handleCreateCol} className="px-2 mb-2">
              <input
                autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => e.key === "Escape" && setShowNewCol(false)}
                placeholder="Collection name…"
                className="w-full text-[12px] bg-white/[0.06] border border-white/10 rounded-md px-2.5 py-1.5 text-white/80 placeholder:text-white/20 outline-none focus:border-indigo-500/40"
              />
            </form>
          )}

          {colsOpen && (
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {(collections as Collection[] | undefined)?.map((col: Collection, i: number) => (
                  <SidebarMenuItem key={col.id}>
                    <SidebarMenuButton asChild isActive={location === `/app/collection/${col.id}`} className="rounded-lg h-8 px-2 text-[13px]">
                      <Link href={`/app/collection/${col.id}`} className="flex items-center gap-2.5">
                        {col.icon ? (
                          <span className="text-[13px] leading-none">{col.icon}</span>
                        ) : (
                          <span className="size-[20px] rounded-[7px] flex items-center justify-center shrink-0"
                            style={{
                              background: `linear-gradient(145deg, ${col.color || COL_COLORS[i % COL_COLORS.length]}35, ${col.color || COL_COLORS[i % COL_COLORS.length]}12)`,
                              border: `1px solid ${col.color || COL_COLORS[i % COL_COLORS.length]}28`,
                              boxShadow: `0 1px 5px ${col.color || COL_COLORS[i % COL_COLORS.length]}18, inset 0 1px 0 rgba(255,255,255,.07)`,
                            }}>
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: col.color || COL_COLORS[i % COL_COLORS.length] }} />
                          </span>
                        )}
                        <span className="flex-1 truncate">{col.name}</span>
                        <span className="text-[11px] tabular-nums opacity-40">{(col as any).bookmarkCount}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Tags */}
        {tags && (tags as any[]).length > 0 && (
          <SidebarGroup>
            <button className="flex items-center gap-1 px-2 mb-2 text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] hover:text-white/40 transition-colors" onClick={() => setTagsOpen(v => !v)}>
              {tagsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Tags
            </button>
            {tagsOpen && (
              <div className="px-2 flex flex-wrap gap-1 pb-2">
                {(tags as any[]).slice(0, 25).map((tag: any) => (
                  <Link key={tag.name} href={`/app?tag=${tag.name}`}>
                    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] border cursor-pointer transition-colors ${
                      qs === `?tag=${tag.name}`
                        ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                        : "bg-white/[0.04] border-white/[0.06] text-white/35 hover:text-white/60 hover:bg-white/[0.07]"
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
        {/* User card */}
        <div className="flex items-center gap-2.5 px-1 py-2 mb-1">
          <div className="size-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold text-indigo-200 uppercase shrink-0"
            style={{ background: "linear-gradient(145deg,rgba(99,102,241,.35),rgba(139,92,246,.18))", borderColor: "rgba(99,102,241,.3)", boxShadow: "0 2px 8px rgba(99,102,241,.2), inset 0 1px 0 rgba(255,255,255,.1)" }}>
            {user.name.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white/80 leading-none truncate">{user.name}</p>
            <p className="text-[11px] text-white/30 mt-0.5 truncate">{user.isGuest ? "Guest session" : user.email}</p>
          </div>
        </div>

        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/ai-settings"} className="rounded-lg h-8 px-2 text-[13px]">
              <Link href="/ai-settings" className="flex items-center gap-2.5">
                <NavIcon icon={Bot} color="#a855f7" />
                <span className="text-indigo-300/75">AI Models</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/settings"} className="rounded-lg h-8 px-2 text-[13px]">
              <Link href="/settings" className="flex items-center gap-2.5">
                <NavIcon icon={Settings} color="#94a3b8" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="rounded-lg h-8 px-2 text-[13px] text-white/40 hover:text-red-400 hover:bg-red-500/[0.06] group/logout">
              <span className="flex items-center gap-2.5 w-full">
                <span className="size-[20px] rounded-[7px] flex items-center justify-center shrink-0 transition-all"
                  style={{ background: "linear-gradient(145deg,rgba(239,68,68,.25),rgba(239,68,68,.1))", border: "1px solid rgba(239,68,68,.22)", boxShadow: "0 1px 5px rgba(239,68,68,.15), inset 0 1px 0 rgba(255,255,255,.06)" }}>
                  <LogOut className="size-2.5 text-red-400/70" strokeWidth={2} style={{ width: 11, height: 11 }} />
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
