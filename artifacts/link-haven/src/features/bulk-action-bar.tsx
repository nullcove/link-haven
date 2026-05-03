import { Trash2, Star, Archive, FolderOpen, X, Loader2, Sparkles, Tag } from "lucide-react";
import { useState } from "react";
import { getAuthToken } from "@/lib/auth";
import { useListCollections, getListCollectionsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface BulkActionBarProps {
  selectedIds: number[];
  onClear: () => void;
  onDone: () => void;
}

export function BulkActionBar({ selectedIds, onClear, onDone }: BulkActionBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  const { data: collections } = useListCollections({ query: { queryKey: getListCollectionsQueryKey() } });

  const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

  const bulkUpdate = async (update: object) => {
    const token = getAuthToken();
    await fetch(`${BASE}/api/bookmarks/bulk-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: selectedIds, update }),
    });
    onDone();
  };

  const bulkDelete = async () => {
    const ok = confirm(`Delete ${selectedIds.length} bookmark${selectedIds.length !== 1 ? "s" : ""}? This cannot be undone.`);
    if (!ok) return;
    setLoading("delete");
    try {
      const token = getAuthToken();
      await fetch(`${BASE}/api/bookmarks/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: selectedIds }),
      });
      onDone();
    } finally {
      setLoading(null);
    }
  };

  const bulkEnrich = async () => {
    setLoading("enrich");
    try {
      const token = getAuthToken();
      const r = await fetch(`${BASE}/api/bookmarks/bulk-enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || "Enrichment failed");
      }
      const data = await r.json() as any;
      toast({ title: "AI Enrichment done", description: `Enriched ${data.enriched} bookmark${data.enriched !== 1 ? "s" : ""} with metadata, topics and key points.` });
      onDone();
    } catch (err: any) {
      toast({ title: "Enrichment failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const bulkAddTag = async () => {
    const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!newTag) return;
    setLoading("tag");
    try {
      const token = getAuthToken();
      await fetch(`${BASE}/api/bookmarks/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: selectedIds, addTag: newTag }),
      });
      toast({ title: `Tagged with #${newTag}`, description: `Applied to ${selectedIds.length} bookmarks.` });
      setTagInput("");
      setShowTagMenu(false);
      onDone();
    } catch {
      toast({ title: "Tagging failed", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const action = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    try { await fn(); }
    finally { setLoading(null); setShowMoveMenu(false); setShowTagMenu(false); }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      {(showMoveMenu || showTagMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowMoveMenu(false); setShowTagMenu(false); }} />
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-2xl shadow-black/60"
        style={{ background: "rgba(14,14,24,0.97)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}>

        {/* Count badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl mr-1"
          style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.3)" }}>
          <span className="text-[13px] font-bold text-indigo-300">{selectedIds.length}</span>
          <span className="text-[10px] text-indigo-400/60">selected</span>
        </div>

        {/* Favourite */}
        <ActionBtn onClick={() => action("fav", () => bulkUpdate({ isFavorite: true }))} loading={loading === "fav"} title="Mark favourite" color="amber">
          <Star className="size-3.5" />
          <span className="hidden sm:inline text-[11px]">Favourite</span>
        </ActionBtn>

        {/* Archive */}
        <ActionBtn onClick={() => action("arch", () => bulkUpdate({ isArchived: true }))} loading={loading === "arch"} title="Archive" color="slate">
          <Archive className="size-3.5" />
          <span className="hidden sm:inline text-[11px]">Archive</span>
        </ActionBtn>

        {/* AI Enrich */}
        <ActionBtn onClick={bulkEnrich} loading={loading === "enrich"} title="AI Enrich selected" color="violet">
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline text-[11px]">AI Enrich</span>
        </ActionBtn>

        {/* Add Tag */}
        <div className="relative">
          <ActionBtn onClick={() => { setShowTagMenu(v => !v); setShowMoveMenu(false); }} loading={loading === "tag"} title="Add tag to selected" color="cyan">
            <Tag className="size-3.5" />
            <span className="hidden sm:inline text-[11px]">Tag</span>
          </ActionBtn>
          {showTagMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 rounded-xl shadow-2xl overflow-hidden z-50 p-3"
              style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[10px] text-white/35 mb-2 uppercase tracking-wider">Add tag to {selectedIds.length} bookmarks</p>
              <div className="flex gap-1.5">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") bulkAddTag(); }}
                  placeholder="tag name"
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-[12px] text-white/80 outline-none focus:border-indigo-500/50 placeholder:text-white/25"
                />
                <button onClick={bulkAddTag} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors">
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Move to collection */}
        <div className="relative">
          <ActionBtn onClick={() => { setShowMoveMenu(v => !v); setShowTagMenu(false); }} loading={loading === "move"} title="Move to collection" color="emerald">
            <FolderOpen className="size-3.5" />
            <span className="hidden sm:inline text-[11px]">Move</span>
          </ActionBtn>
          {showMoveMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-xl shadow-2xl overflow-hidden z-50"
              style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="p-1.5">
                <button onClick={() => action("move", () => bulkUpdate({ collectionId: null }))}
                  className="w-full text-left px-3 py-2 text-[12px] text-white/50 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                  — Unsorted
                </button>
                {collections?.map(c => (
                  <button key={c.id} onClick={() => action("move", () => bulkUpdate({ collectionId: c.id }))}
                    className="w-full text-left px-3 py-2 text-[12px] text-white/50 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 mx-0.5" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Delete */}
        <button onClick={bulkDelete} disabled={!!loading} title="Delete selected"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors disabled:opacity-50 text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.10]">
          {loading === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          <span className="hidden sm:inline text-[11px]">Delete</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-0.5" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Clear */}
        <button onClick={onClear} title="Deselect all"
          className="p-1.5 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors">
          <X className="size-3.5" />
        </button>
      </div>
    </>
  );
}

const COLOR_MAP: Record<string, { bg: string; text: string; hover: string }> = {
  amber:  { bg: "rgba(245,158,11,0.1)",  text: "rgb(251,191,36)",   hover: "rgba(245,158,11,0.15)" },
  slate:  { bg: "rgba(100,116,139,0.1)", text: "rgb(148,163,184)",  hover: "rgba(100,116,139,0.15)" },
  violet: { bg: "rgba(139,92,246,0.1)",  text: "rgb(196,181,253)",  hover: "rgba(139,92,246,0.15)" },
  cyan:   { bg: "rgba(6,182,212,0.1)",   text: "rgb(103,232,249)",  hover: "rgba(6,182,212,0.15)" },
  emerald:{ bg: "rgba(16,185,129,0.1)",  text: "rgb(110,231,183)",  hover: "rgba(16,185,129,0.15)" },
  indigo: { bg: "rgba(99,102,241,0.1)",  text: "rgb(165,180,252)",  hover: "rgba(99,102,241,0.15)" },
};

function ActionBtn({ onClick, loading, title, children, color = "indigo" }: {
  onClick: () => void; loading?: boolean; title: string; children: React.ReactNode; color?: string;
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  return (
    <button onClick={onClick} disabled={!!loading} title={title}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all disabled:opacity-50"
      style={{ color: c.text }}
      onMouseEnter={e => (e.currentTarget.style.background = c.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : children}
    </button>
  );
}
