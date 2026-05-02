import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { User, Collection } from "@workspace/api-client-react";
import {
  useListCollections,
  getListCollectionsQueryKey,
  useListTags,
  getListTagsQueryKey,
  useGetStats,
  getGetStatsQueryKey,
  useLogout,
  useCreateCollection,
} from "@workspace/api-client-react";
import {
  Bookmark,
  Hash,
  LogOut,
  Settings,
  Star,
  Archive,
  FolderPlus,
} from "lucide-react";
import { clearAuthToken } from "@/lib/auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function AppSidebar({ user }: { user: User }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [newColName, setNewColName] = useState("");
  const [showNewCol, setShowNewCol] = useState(false);

  const { data: collections } = useListCollections({
    query: { queryKey: getListCollectionsQueryKey() },
  });
  const { data: tags } = useListTags({
    query: { queryKey: getListTagsQueryKey() },
  });
  const { data: stats } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() },
  });

  const logoutMutation = useLogout();
  const createColMutation = useCreateCollection();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore
    }
    clearAuthToken();
    setLocation("/");
  };

  const handleCreateCol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await createColMutation.mutateAsync({ data: { name: newColName.trim() } });
    queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
    setNewColName("");
    setShowNewCol(false);
  };

  const navItem = (href: string, label: string, icon: React.ReactNode, count?: number) => {
    const isActive =
      href === "/app"
        ? location === "/app" && !window.location.search
        : window.location.pathname + window.location.search === href.replace(window.location.origin, "");
    const fullHref = href.startsWith("/app?")
      ? href
      : href;

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={
            href.includes("?")
              ? window.location.search === href.slice(href.indexOf("?"))
              : location === href
          }
        >
          <Link href={href} className="flex items-center gap-2.5">
            <span className="text-white/40">{icon}</span>
            <span className="flex-1">{label}</span>
            {count != null && (
              <span className="text-[11px] text-white/20 font-mono tabular-nums">{count}</span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const COLLECTION_COLORS = [
    "#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
    "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6",
  ];

  return (
    <Sidebar className="border-r border-white/5 bg-[#0a0a14] text-sidebar-foreground w-56">
      {/* Logo */}
      <SidebarHeader className="px-4 pt-5 pb-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center transition-colors group-hover:bg-indigo-600/30">
            <Bookmark className="size-3.5 text-indigo-400 fill-indigo-500/30" />
          </div>
          <span className="font-bold text-white tracking-tight text-sm">Link Haven</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {/* Library */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] text-white/25 px-4 mb-1">
            Library
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItem("/app", "All Bookmarks", <Bookmark className="size-4" />, stats?.totalBookmarks)}
              {navItem("/app?view=favorites", "Favourites", <Star className="size-4" />, stats?.totalFavorites)}
              {navItem("/app?view=archive", "Archive", <Archive className="size-4" />, stats?.totalArchived)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collections */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] text-white/25 px-4 mb-1 flex items-center justify-between">
            <span>Collections</span>
            <button
              onClick={() => setShowNewCol((v) => !v)}
              className="text-white/25 hover:text-white/60 transition-colors"
              title="New collection"
            >
              <FolderPlus className="size-3.5" />
            </button>
          </SidebarGroupLabel>

          {showNewCol && (
            <form onSubmit={handleCreateCol} className="px-4 mb-2">
              <input
                autoFocus
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setShowNewCol(false)}
                placeholder="Collection name"
                className="w-full text-xs bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-white/80 placeholder:text-white/20 outline-none focus:border-indigo-500/40"
              />
            </form>
          )}

          <SidebarGroupContent>
            <SidebarMenu>
              {collections?.map((col: Collection, i: number) => (
                <SidebarMenuItem key={col.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === `/app/collection/${col.id}`}
                  >
                    <Link href={`/app/collection/${col.id}`} className="flex items-center gap-2.5">
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: col.color || COLLECTION_COLORS[i % COLLECTION_COLORS.length],
                        }}
                      />
                      <span className="flex-1 truncate text-[13px]">{col.name}</span>
                      <span className="text-[11px] text-white/20 tabular-nums font-mono">
                        {col.bookmarkCount}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] text-white/25 px-4 mb-2">
              Tags
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-wrap gap-1 px-3 pb-3">
                {tags.slice(0, 20).map((tag: any) => (
                  <Link key={tag.name} href={`/app?tag=${tag.name}`}>
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-300 px-1.5 py-0.5 text-[11px] text-white/30 transition-colors cursor-pointer">
                      <Hash className="size-2.5 opacity-60" />
                      {tag.name}
                    </span>
                  </Link>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-white/5 p-3">
        {/* User info */}
        <div className="flex items-center gap-2.5 px-1 py-1 mb-2 rounded-lg">
          <div className="size-7 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase shrink-0">
            {user.name.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-white/80 leading-none truncate">
              {user.name}
            </div>
            <div className="text-[11px] text-white/30 mt-0.5 truncate">
              {user.isGuest ? "Guest session" : user.email}
            </div>
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/settings"}>
              <Link href="/settings" className="flex items-center gap-2.5">
                <Settings className="size-4 text-white/35" />
                <span className="text-[13px]">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              data-testid="button-logout"
              className="text-white/35 hover:text-red-400 hover:bg-red-500/5 flex items-center gap-2.5"
            >
              <LogOut className="size-4" />
              <span className="text-[13px]">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
