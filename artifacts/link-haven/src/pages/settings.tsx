import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, getGetMeQueryKey, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export default function SettingsPage() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() }});
  const { data: stats } = useGetStats({ query: { queryKey: getGetStatsQueryKey() }});

  return (
    <AppLayout>
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-6 bg-background/95 backdrop-blur z-10 sticky top-0">
        <h1 className="font-semibold text-lg">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0c]">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <Card className="bg-[#141419] border-white/10">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold uppercase text-primary">
                  {user?.name?.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-medium text-lg">{user?.name}</h3>
                  <p className="text-muted-foreground text-sm">{user?.isGuest ? 'Guest Account' : user?.email}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={user?.name} className="bg-black/50 border-white/10" disabled={user?.isGuest} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user?.email} disabled className="bg-black/50 border-white/10 text-muted-foreground" />
              </div>
              <div className="pt-2">
                <Button disabled={user?.isGuest} className="bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/30">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#141419] border-white/10">
            <CardHeader>
              <CardTitle>Usage Stats</CardTitle>
              <CardDescription>Member since {user && format(new Date(user.createdAt), 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">Bookmarks</span>
                  <span className="text-2xl font-semibold text-foreground">{stats?.totalBookmarks || 0}</span>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">Collections</span>
                  <span className="text-2xl font-semibold text-foreground">{stats?.totalCollections || 0}</span>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">Tags</span>
                  <span className="text-2xl font-semibold text-foreground">{stats?.totalTags || 0}</span>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">Favorites</span>
                  <span className="text-2xl font-semibold text-foreground text-yellow-500">{stats?.totalFavorites || 0}</span>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">Archived</span>
                  <span className="text-2xl font-semibold text-foreground">{stats?.totalArchived || 0}</span>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">Added this month</span>
                  <span className="text-2xl font-semibold text-primary">{stats?.bookmarksThisMonth || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
