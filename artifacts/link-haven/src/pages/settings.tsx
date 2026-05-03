import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, getGetMeQueryKey, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Settings, User, BarChart3, Keyboard, Palette, Bot, ChevronRight } from "lucide-react";
import { Link } from "wouter";

function AIModelsCard() {
  const providers = ["OpenAI", "Anthropic", "Gemini", "Mistral", "Groq", "Perplexity", "Cohere", "OpenRouter", "Together", "Ollama"];
  const colors = ["#10a37f","#d97706","#4285f4","#f97316","#7c3aed","#06b6d4","#14b8a6","#6366f1","#10b981","#e879f9"];
  return (
    <Card className="bg-[#141419] border-white/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-indigo-400" />
          <CardTitle className="text-[15px]">AI Models</CardTitle>
        </div>
        <CardDescription>Connect API keys for cloud providers or your own Ollama instance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {providers.map((p, i) => (
            <span key={p} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/45">
              <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
              {p}
            </span>
          ))}
        </div>
        <Link href="/ai-settings" className="flex items-center justify-between w-full p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/18 hover:border-indigo-500/35 transition-all group">
          <span className="text-[13px] font-semibold text-indigo-300 group-hover:text-indigo-200">Manage AI providers &amp; API keys</span>
          <ChevronRight className="size-4 text-indigo-400/60 group-hover:text-indigo-400 transition-colors" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });

  return (
    <AppLayout>
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-6 bg-background/95 backdrop-blur z-10 sticky top-0">
        <Settings className="size-4 text-indigo-400 mr-2" />
        <h1 className="font-semibold text-[15px]">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0c]">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile */}
          <Card className="bg-[#141419] border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-4 text-indigo-400" />
                <CardTitle className="text-[15px]">Profile</CardTitle>
              </div>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="size-14 rounded-full bg-indigo-600/20 border-2 border-indigo-500/30 flex items-center justify-center text-xl font-bold uppercase text-indigo-300">
                  {user?.name?.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-white">{user?.name}</h3>
                  <p className="text-[12px] text-white/40">{user?.isGuest ? "Guest Account" : user?.email}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] border-indigo-500/25 text-indigo-400 bg-indigo-500/10 h-5 px-2">
                    {user?.isGuest ? "Guest" : "Pro Member"}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="name" className="text-[12px]">Display Name</Label>
                  <Input id="name" defaultValue={user?.name} className="bg-black/50 border-white/10 text-[13px]" disabled={user?.isGuest} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="text-[12px]">Email</Label>
                  <Input id="email" defaultValue={user?.isGuest ? "Guest session" : user?.email} disabled className="bg-black/50 border-white/10 text-muted-foreground text-[13px]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Models */}
          <AIModelsCard />

          {/* Preferences */}
          <Card className="bg-[#141419] border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-indigo-400" />
                <CardTitle className="text-[15px]">Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[12px] mb-2 block">Default View</Label>
                <div className="flex gap-2">
                  {[{ v: "grid", l: "Grid View" }, { v: "list", l: "List View" }].map(({ v, l }) => (
                    <button key={v} className="px-3 py-1.5 rounded-lg text-[12px] border bg-white/[0.04] border-white/[0.08] text-white/45 hover:text-white/70 transition-all">{l}</button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-[#141419] border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-indigo-400" />
                <CardTitle className="text-[15px]">Usage Stats</CardTitle>
              </div>
              <CardDescription>Member since {user && format(new Date(user.createdAt), "MMMM yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Bookmarks", value: stats?.totalBookmarks || 0, color: "text-indigo-400" },
                  { label: "Collections", value: stats?.totalCollections || 0, color: "text-violet-400" },
                  { label: "Tags", value: stats?.totalTags || 0, color: "text-cyan-400" },
                  { label: "Favorites", value: stats?.totalFavorites || 0, color: "text-amber-400" },
                  { label: "Archived", value: stats?.totalArchived || 0, color: "text-white/50" },
                  { label: "This month", value: stats?.bookmarksThisMonth || 0, color: "text-emerald-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] flex flex-col gap-1">
                    <span className="text-[11px] text-white/35">{label}</span>
                    <span className={`text-2xl font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyboard shortcuts */}
          <Card className="bg-[#141419] border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Keyboard className="size-4 text-indigo-400" />
                <CardTitle className="text-[15px]">Keyboard Shortcuts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {[
                  { key: "⌘K", label: "Open command palette" },
                  { key: "⌘N", label: "Add new bookmark" },
                  { key: "⌘F", label: "Focus search" },
                  { key: "⌘J", label: "Toggle Gemini AI chat" },
                  { key: "G then A", label: "Go to All Bookmarks" },
                  { key: "G then S", label: "Go to Settings" },
                  { key: "Esc", label: "Close dialog / panel" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-[12px] text-white/55">{label}</span>
                    <kbd className="text-[10px] bg-white/[0.06] border border-white/[0.1] rounded px-2 py-0.5 text-white/40 font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
