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
  SidebarSeparator
} from "@/components/ui/sidebar";
import { User, Collection } from "@workspace/api-client-react";
import { useListCollections, getListCollectionsQueryKey, useListTags, getListTagsQueryKey, useGetStats, getGetStatsQueryKey, useLogout } from "@workspace/api-client-react";
import { Bookmark, Folder, Hash, Inbox, LogOut, Settings, Star, Layers, Activity } from "lucide-react";
import { clearAuthToken } from "@/lib/auth";
import { Button } from "./ui/button";

export function AppSidebar({ user }: { user: User }) {
  const [location, setLocation] = useLocation();

  const { data: collections } = useListCollections({
    query: { queryKey: getListCollectionsQueryKey() }
  });

  const { data: tags } = useListTags({
    query: { queryKey: getListTagsQueryKey() }
  });

  const { data: stats } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() }
  });

  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      clearAuthToken();
      setLocation("/");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <Sidebar className="border-r border-white/5 bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 py-2">
          <div className="size-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <div className="size-3 bg-primary rounded-sm shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
          </div>
          <span className="font-bold text-lg tracking-tight">Link Haven</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/app"}>
                  <Link href="/app">
                    <Bookmark className="mr-2 size-4" />
                    <span>All Bookmarks</span>
                    {stats && <span className="ml-auto text-xs text-muted-foreground">{stats.totalBookmarks}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/app?view=favorites"}>
                  <Link href="/app?view=favorites">
                    <Star className="mr-2 size-4 text-yellow-500" />
                    <span>Favorites</span>
                    {stats && <span className="ml-auto text-xs text-muted-foreground">{stats.totalFavorites}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/app?view=archive"}>
                  <Link href="/app?view=archive">
                    <Inbox className="mr-2 size-4" />
                    <span>Archive</span>
                    {stats && <span className="ml-auto text-xs text-muted-foreground">{stats.totalArchived}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/5" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground flex justify-between items-center">
            <span>Collections</span>
            <Button variant="ghost" size="icon" className="size-5 h-5 w-5 rounded-full hover:bg-white/10">
              <span className="text-lg leading-none">+</span>
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {collections?.map((col: Collection) => (
                <SidebarMenuItem key={col.id}>
                  <SidebarMenuButton asChild isActive={location === `/app/collection/${col.id}`}>
                    <Link href={`/app/collection/${col.id}`}>
                      <div 
                        className="mr-2 size-3 rounded-full" 
                        style={{ backgroundColor: col.color || 'hsl(var(--primary))' }}
                      />
                      <span className="truncate">{col.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{col.bookmarkCount}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/5" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-wrap gap-1 px-2 pt-1 pb-4">
              {tags?.slice(0, 15).map((tag: any) => (
                <Link key={tag.name} href={`/app?tag=${tag.name}`}>
                  <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer border border-white/5">
                    <Hash className="size-3 mr-1 opacity-50" />
                    {tag.name}
                  </span>
                </Link>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/settings"}>
              <Link href="/settings">
                <Settings className="mr-2 size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-4 px-2 flex items-center gap-3">
          <div className="size-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium uppercase border border-white/5">
            {user.name.substring(0, 2)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{user.name}</span>
            <span className="text-xs text-muted-foreground mt-1">{user.isGuest ? 'Guest User' : user.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
