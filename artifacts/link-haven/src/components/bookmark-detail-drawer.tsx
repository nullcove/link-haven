import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent } from "./ui/sheet";
import { format, formatDistanceToNow } from "date-fns";
import {
  ExternalLink, Copy, Star, Trash2, Archive, Globe, X, Hash, Calendar,
  FolderOpen, Sparkles, Loader2, Pin, Share2, QrCode, CheckCheck, Edit3,
  Save, RotateCcw, Clock, BookOpen, User, Languages, Tag, TrendingUp,
  AlertCircle, CheckCircle2, AlertTriangle, Activity, Eye, RefreshCw,
  ChevronRight, Zap, Brain, FileText, Link2, BarChart3, Heart,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useListCollections, getListBookmarksQueryKey, getListCollectionsQueryKey } from "@workspace/api-client-react";

type Bookmark = any;

const BASE = () => (import.meta.env.BASE_URL || "").replace(/\/$/, "");

async function apiCall(path: string, method = "GET", body?: any) {
  const token = getAuthToken();
  const opts: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE()}${path}`, opts);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).error || r.statusText); }
  return r.json();
}

/* ─── Sentiment badge ─────────────────────────────────────── */
function SentimentBadge({ sentiment }: { sentiment: string }) {
  const cfg: Record<string, { color: string; bg: string; icon: string }> = {
    positive: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "😊" },
    negative: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: "😟" },
    neutral:  { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: "😐" },
    mixed:    { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: "🤔" },
  };
  const c = cfg[sentiment?.toLowerCase()] ?? cfg.neutral;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium capitalize", c.color, c.bg)}>
      <span>{c.icon}</span> {sentiment}
    </span>
  );
}

/* ─── Link status badge ───────────────────────────────────── */
function LinkStatusBadge({ status, checking, onCheck }: { status?: number | null; checking: boolean; onCheck: () => void }) {
  if (checking) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.09] text-[11px] text-white/50">
      <Loader2 className="size-3 animate-spin" /> Checking…
    </span>
  );
  if (!status) return (
    <button onClick={onCheck} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.09] text-[11px] text-white/40 hover:text-white/70 transition-colors">
      <RefreshCw className="size-3" /> Check status
    </button>
  );
  const ok = status >= 200 && status < 400;
  const warn = status >= 400 && status < 500;
  if (ok) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]"><CheckCircle2 className="size-3" /> {status} OK</span>;
  if (warn) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]"><AlertTriangle className="size-3" /> {status} {status === 404 ? "Not Found" : "Client Error"}</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]"><AlertCircle className="size-3" /> {status === 0 ? "Unreachable" : `${status} Error`}</span>;
}

/* ─── Section header ──────────────────────────────────────── */
function SectionHeader({ icon: Icon, label, color = "#6366f1" }: { icon: any; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="size-5 rounded-md flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
        <Icon className="size-3" style={{ color }} />
      </div>
      <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}

/* ─── Inline editable field ───────────────────────────────── */
function EditableField({ value, placeholder, onSave, multiline = false }: {
  value: string; placeholder: string; onSave: (v: string) => Promise<void>; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const save = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft); setEditing(false); } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        {multiline ? (
          <textarea
            autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.06] border border-indigo-500/40 rounded-xl text-[13px] text-white/85 resize-none outline-none focus:border-indigo-500/60 transition-all"
            rows={3} />
        ) : (
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setDraft(value); } }}
            className="w-full px-3 py-2 bg-white/[0.06] border border-indigo-500/40 rounded-xl text-[13px] text-white/85 outline-none focus:border-indigo-500/60 transition-all" />
        )}
        <div className="flex gap-1.5">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Save
          </button>
          <button onClick={() => { setEditing(false); setDraft(value); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/50 text-[11px] transition-colors">
            <RotateCcw className="size-3" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="group w-full text-left">
      <span className={cn("text-[13px] leading-relaxed transition-colors group-hover:text-white", value ? "text-white/75" : "text-white/25 italic")}>
        {value || placeholder}
      </span>
      <Edit3 className="size-3 text-white/20 group-hover:text-indigo-400 ml-1.5 inline opacity-0 group-hover:opacity-100 transition-all" />
    </button>
  );
}

/* ─── Tag editor ──────────────────────────────────────────── */
function TagEditor({ tags, onSave }: { tags: string[]; onSave: (t: string[]) => Promise<void> }) {
  const [input, setInput] = useState("");
  const [current, setCurrent] = useState(tags);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setCurrent(tags); }, [tags]);

  const addTag = async () => {
    const newTag = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (!newTag || current.includes(newTag)) { setInput(""); return; }
    const next = [...current, newTag];
    setCurrent(next);
    setInput("");
    setSaving(true);
    try { await onSave(next); } finally { setSaving(false); }
  };

  const removeTag = async (tag: string) => {
    const next = current.filter(t => t !== tag);
    setCurrent(next);
    setSaving(true);
    try { await onSave(next); } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {current.map(tag => (
        <span key={tag} className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300/80">
          #{tag}
          <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-300/50 hover:text-red-400">
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addTag(); }}
          placeholder="+ add tag"
          className="w-20 px-2 py-0.5 bg-transparent border border-dashed border-white/[0.12] rounded-lg text-[11px] text-white/40 placeholder:text-white/20 outline-none focus:border-indigo-500/40 focus:text-white/70 transition-all"
        />
        {saving && <Loader2 className="size-3 text-white/30 animate-spin" />}
      </div>
    </div>
  );
}

/* ─── QR Code (simple SVG via API) ───────────────────────── */
function QrDisplay({ url }: { url: string }) {
  const [show, setShow] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&bgcolor=0c0c14&color=a5b4fc&margin=10`;
  return (
    <div>
      <button onClick={() => setShow(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.09] text-[11px] text-white/50 hover:text-white/80 hover:border-white/[0.15] transition-colors">
        <QrCode className="size-3" /> {show ? "Hide QR" : "Show QR Code"}
      </button>
      {show && (
        <div className="mt-3 flex justify-center">
          <div className="p-3 rounded-2xl bg-[#0c0c14] border border-white/[0.09]">
            <img src={qrUrl} alt="QR Code" className="size-[140px] rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Related bookmark mini card ─────────────────────────── */
function RelatedCard({ b, onSelect }: { b: any; onSelect: (b: any) => void }) {
  return (
    <button onClick={() => onSelect(b)}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] text-left transition-all group">
      {b.favicon
        ? <img src={b.favicon} alt="" className="size-6 rounded-md shrink-0" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
        : <Globe className="size-6 text-white/20 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-white/70 group-hover:text-white truncate transition-colors">{b.title}</p>
        <p className="text-[10px] text-white/25 truncate">{b.domain}</p>
      </div>
      <ChevronRight className="size-3.5 text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
    </button>
  );
}

/* ─── Tab pill ────────────────────────────────────────────── */
function Tab({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: any; label: string; badge?: number }) {
  return (
    <button onClick={onClick} className={cn(
      "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
      active ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-white/40 hover:text-white/70 border border-transparent"
    )}>
      <Icon className="size-3" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-indigo-500 text-[9px] text-white flex items-center justify-center font-bold">{badge}</span>
      )}
    </button>
  );
}

/* ─── MAIN DRAWER ─────────────────────────────────────────── */
export function BookmarkDetailDrawer({ bookmark, open, onOpenChange, onDelete, onUpdate }: {
  bookmark: Bookmark | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: number) => void;
  onUpdate?: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "related">("overview");
  const [note, setNote] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [checkingLink, setCheckingLink] = useState(false);
  const [related, setRelated] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localBookmark, setLocalBookmark] = useState<any>(null);

  const { data: collections } = useListCollections({ query: { queryKey: getListCollectionsQueryKey() } });

  useEffect(() => {
    if (bookmark) {
      setNote(bookmark.note || "");
      setLocalBookmark(bookmark);
      setRelated([]);
      setActiveTab("overview");
    }
  }, [bookmark]);

  if (!bookmark) return null;

  const bk = localBookmark || bookmark;
  const keyPoints: string[] = (() => { try { return bk.keyPoints ? JSON.parse(bk.keyPoints) : []; } catch { return []; } })();
  const topics: string[] = bk.topics || [];
  const domain = (() => { try { return bk.domain || new URL(bk.url).hostname.replace("www.", ""); } catch { return ""; } })();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });

  const refreshLocal = async () => {
    try {
      const updated = await apiCall(`/api/bookmarks/${bk.id}`);
      setLocalBookmark(updated);
      setNote(updated.note || "");
      invalidate();
      onUpdate?.();
    } catch { /* ignore */ }
  };

  const handleSaveNote = async () => {
    await apiCall(`/api/bookmarks/${bk.id}`, "PATCH", { note });
    toast({ title: "Note saved" });
    await refreshLocal();
  };

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const updated = await apiCall(`/api/bookmarks/${bk.id}/enrich`, "POST");
      setLocalBookmark(updated);
      setNote(updated.note || "");
      invalidate();
      toast({ title: "AI enrichment complete", description: "Metadata, key points, and topics extracted." });
    } catch (err: any) {
      toast({ title: "Enrichment failed", description: err.message, variant: "destructive" });
    } finally {
      setEnriching(false);
    }
  };

  const handleCheckLink = async () => {
    setCheckingLink(true);
    try {
      const updated = await apiCall(`/api/bookmarks/${bk.id}/check-link`, "POST");
      setLocalBookmark(updated);
      invalidate();
      toast({ title: `Link status: ${updated.linkStatus}`, description: updated.linkOk ? "Link is reachable ✓" : "Link may be broken." });
    } catch (err: any) {
      toast({ title: "Check failed", description: err.message, variant: "destructive" });
    } finally {
      setCheckingLink(false);
    }
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    await apiCall(`/api/bookmarks/${bk.id}`, "PATCH", { [field]: value });
    await refreshLocal();
  };

  const handleTagUpdate = async (tags: string[]) => {
    await apiCall(`/api/bookmarks/${bk.id}`, "PATCH", { tags });
    await refreshLocal();
  };

  const handleToggleFavorite = async () => {
    await apiCall(`/api/bookmarks/${bk.id}/favorite`, "PATCH");
    await refreshLocal();
  };

  const handleToggleArchive = async () => {
    await apiCall(`/api/bookmarks/${bk.id}/archive`, "PATCH");
    await refreshLocal();
    onOpenChange(false);
  };

  const handleTogglePin = async () => {
    await apiCall(`/api/bookmarks/${bk.id}`, "PATCH", { isPinned: !bk.isPinned });
    await refreshLocal();
  };

  const handleVisit = async () => {
    window.open(bk.url, "_blank", "noopener");
    apiCall(`/api/bookmarks/${bk.id}/visit`, "PATCH").then(refreshLocal).catch(() => {});
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bk.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!" });
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(`[${bk.title}](${bk.url})`);
    toast({ title: "Copied as Markdown!" });
  };

  const loadRelated = useCallback(async () => {
    setLoadingRelated(true);
    try {
      const data = await apiCall(`/api/bookmarks/${bk.id}/related`);
      setRelated(data);
    } catch { /* ignore */ } finally {
      setLoadingRelated(false);
    }
  }, [bk?.id]);

  useEffect(() => {
    if (activeTab === "related" && related.length === 0 && !loadingRelated) {
      loadRelated();
    }
  }, [activeTab]);

  const aiInsightCount = keyPoints.length + topics.length + (bk.sentiment ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] bg-[#08080f] border-l border-white/[0.07] p-0 flex flex-col overflow-hidden gap-0"
      >
        {/* Close */}
        <button onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-20 size-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <X className="size-3.5" />
        </button>

        {/* Cover */}
        <div className="relative h-40 shrink-0 bg-[#0f0f1e] overflow-hidden">
          {bk.coverImage ? (
            <img src={bk.coverImage} alt="" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.25), transparent 65%), radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.15), transparent 60%)" }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/50 to-transparent" />

          {/* Domain */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            {bk.favicon
              ? <img src={bk.favicon} className="size-5 rounded-md shadow-lg" alt="" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
              : <div className="size-5 rounded-md bg-white/10 flex items-center justify-center"><Globe className="size-3 text-white/40" /></div>}
            <div>
              <p className="text-[11px] text-white/55 font-medium">{domain}</p>
              {bk.visitCount > 0 && (
                <p className="text-[10px] text-white/25 flex items-center gap-1"><Eye className="size-2.5" /> {bk.visitCount} visit{bk.visitCount !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>

          {/* Flags */}
          <div className="absolute top-3 left-4 flex items-center gap-1.5">
            {bk.isFavorite && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px]">
                <Star className="size-2.5 fill-amber-400" /> Favourite
              </div>
            )}
            {bk.isPinned && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px]">
                <Pin className="size-2.5" /> Pinned
              </div>
            )}
            {bk.isArchived && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/20 border border-slate-500/30 text-slate-400 text-[10px]">
                <Archive className="size-2.5" /> Archived
              </div>
            )}
          </div>
        </div>

        {/* Title + type */}
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-start gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              <EditableField
                value={bk.title}
                placeholder="Add title…"
                onSave={v => handleFieldUpdate("title", v)}
              />
            </div>
            <select
              value={bk.type || "link"}
              onChange={async e => { await handleFieldUpdate("type", e.target.value); }}
              className="shrink-0 px-2 py-1 bg-white/[0.05] border border-white/[0.09] rounded-lg text-[10px] text-white/50 outline-none cursor-pointer appearance-none"
            >
              {["link", "article", "image", "video", "document", "audio"].map(t => (
                <option key={t} value={t} className="bg-[#0f0f1c] capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          {/* Description editable */}
          <div className="text-[12px] text-white/35">
            <EditableField
              value={bk.description || ""}
              placeholder="Add a description…"
              onSave={v => handleFieldUpdate("description", v)}
              multiline
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-white/[0.06] overflow-x-auto shrink-0">
          <button onClick={handleVisit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <ExternalLink className="size-3.5" /> Open
          </button>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-white/55 hover:text-white text-[11px] transition-colors shrink-0">
            {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
          <button onClick={handleCopyMd}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-white/55 hover:text-white text-[11px] transition-colors shrink-0">
            <Link2 className="size-3.5" /> MD
          </button>
          <button onClick={handleToggleFavorite}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors shrink-0",
              bk.isFavorite ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-white/[0.05] border-white/[0.09] text-white/40 hover:text-amber-400")}>
            <Star className={cn("size-3.5", bk.isFavorite && "fill-amber-400")} />
          </button>
          <button onClick={handleTogglePin}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors shrink-0",
              bk.isPinned ? "bg-violet-500/15 border-violet-500/30 text-violet-400" : "bg-white/[0.05] border-white/[0.09] text-white/40 hover:text-violet-400")}>
            <Pin className="size-3.5" />
          </button>
          <button onClick={handleToggleArchive}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-white/40 hover:text-white text-[11px] transition-colors shrink-0">
            <Archive className="size-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06] overflow-x-auto shrink-0">
          <Tab active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={FileText} label="Overview" />
          <Tab active={activeTab === "ai"} onClick={() => setActiveTab("ai")} icon={Brain} label="AI Insights" badge={aiInsightCount > 0 ? aiInsightCount : undefined} />
          <Tab active={activeTab === "related"} onClick={() => setActiveTab("related")} icon={Share2} label="Related" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* ─── OVERVIEW TAB ──────────────────────────── */}
            {activeTab === "overview" && (
              <>
                {/* Meta info grid */}
                <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] space-y-3">
                  <SectionHeader icon={BarChart3} label="Details" color="#6366f1" />
                  <MetaRow icon={Calendar} label="Saved">
                    {format(new Date(bk.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </MetaRow>
                  {bk.updatedAt && bk.updatedAt !== bk.createdAt && (
                    <MetaRow icon={RefreshCw} label="Updated">
                      {formatDistanceToNow(new Date(bk.updatedAt), { addSuffix: true })}
                    </MetaRow>
                  )}
                  {bk.author && (
                    <MetaRow icon={User} label="Author">{bk.author}</MetaRow>
                  )}
                  {bk.publishedAt && (
                    <MetaRow icon={Calendar} label="Published">
                      {format(new Date(bk.publishedAt), "MMM d, yyyy")}
                    </MetaRow>
                  )}
                  {(bk.wordCount || bk.readingTime) && (
                    <MetaRow icon={Clock} label="Read time">
                      {bk.readingTime && `~${bk.readingTime} min`}{bk.wordCount && ` (${bk.wordCount.toLocaleString()} words)`}
                    </MetaRow>
                  )}
                  {bk.language && (
                    <MetaRow icon={Languages} label="Language">{bk.language}</MetaRow>
                  )}
                  {bk.visitCount > 0 && (
                    <MetaRow icon={Activity} label="Visits">
                      {bk.visitCount} time{bk.visitCount !== 1 ? "s" : ""}
                      {bk.lastVisitedAt && ` · last ${formatDistanceToNow(new Date(bk.lastVisitedAt), { addSuffix: true })}`}
                    </MetaRow>
                  )}
                  {bk.lastCheckedAt && (
                    <MetaRow icon={CheckCircle2} label="Link check">
                      <LinkStatusBadge status={bk.linkStatus} checking={checkingLink} onCheck={handleCheckLink} />
                    </MetaRow>
                  )}
                </div>

                {/* Link health (if not yet checked) */}
                {!bk.lastCheckedAt && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-white/60">Link health</p>
                        <p className="text-[10px] text-white/25">Not checked yet</p>
                      </div>
                    </div>
                    <LinkStatusBadge status={null} checking={checkingLink} onCheck={handleCheckLink} />
                  </div>
                )}

                {/* Collection */}
                <div className="space-y-2">
                  <SectionHeader icon={FolderOpen} label="Collection" color="#10b981" />
                  <select
                    value={bk.collectionId?.toString() || "none"}
                    onChange={async e => {
                      const v = e.target.value;
                      await handleFieldUpdate("collectionId", v === "none" ? null : parseInt(v, 10));
                    }}
                    className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.09] rounded-xl text-[12px] text-white/70 outline-none focus:border-indigo-500/40 cursor-pointer appearance-none transition-all"
                  >
                    <option value="none" className="bg-[#0f0f1c]">— No collection —</option>
                    {collections?.map(c => (
                      <option key={c.id} value={c.id.toString()} className="bg-[#0f0f1c]">{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <SectionHeader icon={Hash} label="Tags" color="#8b5cf6" />
                  <TagEditor tags={bk.tags || []} onSave={handleTagUpdate} />
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <SectionHeader icon={Link2} label="URL" color="#f59e0b" />
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-white/40 break-all flex-1 font-mono leading-relaxed">{bk.url}</p>
                  </div>
                </div>

                {/* QR Code */}
                <QrDisplay url={bk.url} />

                {/* Note */}
                <div className="space-y-2">
                  <SectionHeader icon={BookOpen} label="Personal Note" color="#ef4444" />
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Write your thoughts about this link…"
                    className="min-h-[100px] bg-white/[0.04] border border-white/[0.08] focus-visible:border-indigo-500/40 resize-none text-[13px] text-white/70 placeholder:text-white/20 rounded-xl"
                  />
                  {note !== (bk.note || "") && (
                    <div className="flex justify-end">
                      <button onClick={handleSaveNote}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-medium transition-colors">
                        Save note
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── AI INSIGHTS TAB ──────────────────────── */}
            {activeTab === "ai" && (
              <>
                {/* Enrich button */}
                <div className="p-4 rounded-2xl border transition-all"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))", borderColor: "rgba(99,102,241,0.2)" }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="size-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                      <Zap className="size-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white/80 mb-0.5">AI Deep Enrichment</p>
                      <p className="text-[11px] text-white/35 leading-relaxed">Scrapes the page and extracts author, publish date, topics, key points, sentiment, language, and reading time — all automatically.</p>
                    </div>
                  </div>
                  <button onClick={handleEnrich} disabled={enriching}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[12px] text-white transition-all disabled:opacity-60"
                    style={{ background: enriching ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: enriching ? "none" : "0 4px 20px rgba(99,102,241,0.35)" }}>
                    {enriching ? (
                      <><Loader2 className="size-4 animate-spin" /> Enriching with AI…</>
                    ) : (
                      <><Sparkles className="size-4" /> {aiInsightCount > 0 ? "Re-enrich" : "Enrich with AI"}</>
                    )}
                  </button>
                  {aiInsightCount === 0 && !enriching && (
                    <p className="text-[10px] text-white/25 text-center mt-2">No AI data yet — click above to analyze this page</p>
                  )}
                </div>

                {/* Sentiment */}
                {bk.sentiment && (
                  <div className="space-y-2">
                    <SectionHeader icon={Heart} label="Sentiment" color="#ec4899" />
                    <SentimentBadge sentiment={bk.sentiment} />
                  </div>
                )}

                {/* Topics */}
                {topics.length > 0 && (
                  <div className="space-y-2.5">
                    <SectionHeader icon={TrendingUp} label="Topics & Keywords" color="#06b6d4" />
                    <div className="flex flex-wrap gap-1.5">
                      {topics.map((topic: string) => (
                        <span key={topic}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                          style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#67e8f9" }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {keyPoints.length > 0 && (
                  <div className="space-y-2.5">
                    <SectionHeader icon={Sparkles} label="Key Points" color="#a855f7" />
                    <ul className="space-y-2">
                      {keyPoints.map((point: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="size-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center text-[9px] font-bold text-violet-300"
                            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.25)" }}>
                            {i + 1}
                          </div>
                          <p className="text-[12px] text-white/65 leading-relaxed">{point}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI-enriched metadata */}
                {(bk.author || bk.publishedAt || bk.wordCount || bk.language) && (
                  <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] space-y-3">
                    <SectionHeader icon={Brain} label="Extracted Metadata" color="#f59e0b" />
                    {bk.author && <MetaRow icon={User} label="Author">{bk.author}</MetaRow>}
                    {bk.publishedAt && <MetaRow icon={Calendar} label="Published">{format(new Date(bk.publishedAt), "MMM d, yyyy")}</MetaRow>}
                    {bk.wordCount && <MetaRow icon={FileText} label="Word count">{bk.wordCount.toLocaleString()}</MetaRow>}
                    {bk.readingTime && <MetaRow icon={Clock} label="Reading time">~{bk.readingTime} minutes</MetaRow>}
                    {bk.language && <MetaRow icon={Languages} label="Language">{bk.language}</MetaRow>}
                  </div>
                )}

                {/* Note from AI */}
                <div className="space-y-2">
                  <SectionHeader icon={BookOpen} label="AI Summary Note" color="#ef4444" />
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="No note yet — click Enrich with AI to auto-generate a summary…"
                    className="min-h-[110px] bg-white/[0.04] border border-white/[0.08] focus-visible:border-indigo-500/40 resize-none text-[13px] text-white/70 placeholder:text-white/20 rounded-xl"
                  />
                  {note !== (bk.note || "") && (
                    <div className="flex justify-end">
                      <button onClick={handleSaveNote}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-medium transition-colors">
                        Save note
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── RELATED TAB ─────────────────────────── */}
            {activeTab === "related" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <SectionHeader icon={Share2} label="Related Bookmarks" color="#10b981" />
                  <button onClick={loadRelated} disabled={loadingRelated}
                    className="text-[11px] text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
                    <RefreshCw className={cn("size-3", loadingRelated && "animate-spin")} /> Refresh
                  </button>
                </div>
                {loadingRelated ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-5 text-indigo-400 animate-spin" />
                  </div>
                ) : related.length > 0 ? (
                  <div className="space-y-2">
                    {related.map((r: any) => (
                      <RelatedCard key={r.id} b={r} onSelect={b => {
                        setLocalBookmark(b);
                        setNote(b.note || "");
                        setRelated([]);
                        setActiveTab("overview");
                      }} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="size-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3">
                      <Share2 className="size-5 text-white/20" />
                    </div>
                    <p className="text-[13px] text-white/30 mb-1">No related bookmarks found</p>
                    <p className="text-[11px] text-white/18">Add tags or enrich with AI to improve matching</p>
                  </div>
                )}

                {/* Topics info */}
                {topics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.05]">
                    <p className="text-[11px] text-white/25 mb-2">Matched by topics:</p>
                    <div className="flex flex-wrap gap-1">
                      {topics.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-md text-[10px] text-cyan-400/60 bg-cyan-500/05 border border-cyan-500/10">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {bk.tags?.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] text-white/25 mb-2">Matched by tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {bk.tags.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded-md text-[10px] text-indigo-400/60 bg-indigo-500/05 border border-indigo-500/10">#{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-4 flex items-center gap-2 shrink-0">
          <button onClick={() => { onDelete(bk.id); onOpenChange(false); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.07] border border-transparent hover:border-red-500/15 text-[12px] transition-all">
            <Trash2 className="size-3.5" /> Delete
          </button>
          <div className="text-[10px] text-white/15 text-center">
            ID #{bk.id}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetaRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1.5 w-24 shrink-0 pt-0.5">
        <Icon className="size-3.5 text-white/20" />
        <span className="text-[11px] text-white/28">{label}</span>
      </div>
      <div className="text-[12px] text-white/60 leading-relaxed">{children}</div>
    </div>
  );
}
