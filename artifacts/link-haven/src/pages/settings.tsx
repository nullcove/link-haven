import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, getGetMeQueryKey, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Eye, EyeOff, Key, CheckCircle2, XCircle, Loader2,
  Sparkles, Trash2, Settings, User, BarChart3, Keyboard, Palette,
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SettingsData = {
  hasGeminiKey: boolean;
  geminiKeyMasked: string | null;
  theme: string;
  defaultView: string;
};

function GeminiSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => { apiCall("/settings").then(setSettings as any).catch(() => {}); }, []);

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      const res = await apiCall("/settings", { method: "PUT", body: JSON.stringify({ geminiApiKey: keyInput.trim() }) }) as SettingsData;
      setSettings(res); setKeyInput(""); setTestResult(null);
      toast({ title: "API key saved", description: "Gemini is now connected." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const body: any = {};
      if (keyInput.trim()) body.apiKey = keyInput.trim();
      const res = await apiCall("/gemini/test", { method: "POST", body: JSON.stringify(body) }) as any;
      setTestResult({ success: res.success, message: res.message || res.error || "Connected!" });
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally { setTesting(false); }
  };

  const handleRemove = async () => {
    try {
      await apiCall("/settings/gemini-key", { method: "DELETE" });
      setSettings(s => s ? { ...s, hasGeminiKey: false, geminiKeyMasked: null } : s);
      setTestResult(null);
      toast({ title: "API key removed" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <Card className="bg-[#141419] border-white/10">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="size-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-[15px]">Gemini AI Integration</CardTitle>
              {settings?.hasGeminiKey && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px] h-5">
                  <CheckCircle2 className="size-2.5 mr-1" /> Connected
                </Badge>
              )}
            </div>
            <CardDescription className="mt-0.5">Connect Google Gemini for full AI-powered bookmark management — chat, auto-tag, summarize, organize</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {settings?.hasGeminiKey && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/15">
            <Key className="size-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-emerald-400">API Key Configured</p>
              <p className="text-[11px] text-white/40 font-mono mt-0.5">{settings.geminiKeyMasked}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-[11px] h-7 px-2">
              <Trash2 className="size-3 mr-1" /> Remove
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-[12px] text-white/60">{settings?.hasGeminiKey ? "Update API Key" : "Enter your Gemini API Key"}</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25 pointer-events-none" />
            <Input
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="AIzaSy..."
              className="pl-9 pr-10 bg-black/50 border-white/10 font-mono text-[12px] focus:border-indigo-500/40 placeholder:text-white/20"
            />
            <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-white/30">
            Get your free key at{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-indigo-400 hover:text-indigo-300 underline">
              aistudio.google.com
            </a>
            {" "}— your key is stored securely on the server and is never visible after saving.
          </p>
        </div>

        {testResult && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-xl border text-[12px]",
            testResult.success ? "bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-400" : "bg-red-500/[0.07] border-red-500/20 text-red-400"
          )}>
            {testResult.success ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
            {testResult.message}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={handleTest} disabled={testing || (!keyInput.trim() && !settings?.hasGeminiKey)} variant="outline" size="sm" className="border-white/10 bg-white/[0.04] text-white/60 hover:text-white text-[12px]">
            {testing ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Sparkles className="size-3.5 mr-1.5 text-violet-400" />}
            Test Connection
          </Button>
          <Button onClick={handleSave} disabled={saving || !keyInput.trim()} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-[12px]">
            {saving ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Key className="size-3.5 mr-1.5" />}
            Save Key
          </Button>
        </div>

        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2.5">What Gemini can do for you</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              "Chat with your entire library", "Auto-generate smart tags",
              "Summarize any bookmark", "Organize collections intelligently",
              "Smart search & insights", "Analyze reading patterns",
              "Suggest related content", "Full AI management",
            ].map(f => (
              <div key={f} className="flex items-center gap-1.5 text-[11px] text-white/40">
                <div className="size-1.5 rounded-full bg-indigo-500/60 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
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

          {/* Gemini AI */}
          <GeminiSection />

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
