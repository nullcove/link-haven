import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

interface DuplicateFinderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DuplicateFinder({ open, onOpenChange, onDeleted }: DuplicateFinderProps) {
  const [groups, setGroups] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const scan = async () => {
    setLoading(true);
    setScanned(false);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/bookmarks/duplicates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGroups(data);
      setScanned(true);
    } finally {
      setLoading(false);
    }
  };

  const deleteBookmark = async (id: number, groupIdx: number) => {
    setDeleting(id);
    try {
      const token = getAuthToken();
      await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(prev => {
        const updated = [...prev];
        updated[groupIdx] = updated[groupIdx].filter(b => b.id !== id);
        return updated.filter(g => g.length > 1);
      });
      onDeleted?.();
    } finally {
      setDeleting(null);
    }
  };

  const keepNewest = async (groupIdx: number) => {
    const group = groups[groupIdx];
    const sorted = [...group].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const toDelete = sorted.slice(1);
    for (const b of toDelete) {
      await deleteBookmark(b.id, groupIdx);
    }
  };

  const totalDuplicates = groups.reduce((acc, g) => acc + g.length - 1, 0);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setScanned(false); setGroups([]); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-xl bg-[#0f0f1c] border border-white/[0.09] rounded-2xl p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/[0.07] shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold">
            <Copy className="size-4 text-orange-400" />
            Duplicate Finder
          </DialogTitle>
          <p className="text-[12px] text-white/40 mt-0.5">Find and remove bookmarks with the same URL</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {!scanned ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="size-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                <Copy className="size-7 text-orange-400/60" />
              </div>
              <p className="text-[14px] font-semibold text-white/50 mb-2">Scan your library for duplicates</p>
              <p className="text-[12px] text-white/25 mb-6">We'll find all bookmarks pointing to the same URL</p>
              <button
                onClick={scan}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600/80 hover:bg-orange-500/80 text-white text-[13px] font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
                {loading ? "Scanning…" : "Scan now"}
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-[15px] font-bold text-emerald-400 mb-1">No duplicates found!</p>
              <p className="text-[12px] text-white/30">Your library is clean.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] text-white/50">
                  Found <span className="text-orange-400 font-bold">{totalDuplicates}</span> duplicate{totalDuplicates !== 1 ? "s" : ""} in <span className="font-bold text-white/70">{groups.length}</span> group{groups.length !== 1 ? "s" : ""}
                </p>
              </div>

              {groups.map((group, gi) => (
                <div key={gi} className="rounded-xl border border-white/[0.07] overflow-hidden">
                  <div className="px-3.5 py-2 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {group[0].favicon && (
                        <img src={group[0].favicon} className="size-3.5 rounded-sm shrink-0" alt="" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                      )}
                      <span className="text-[11px] text-white/40 truncate">{group[0].domain || new URL(group[0].url).hostname}</span>
                    </div>
                    <button
                      onClick={() => keepNewest(gi)}
                      className="text-[11px] text-orange-400/70 hover:text-orange-400 transition-colors font-medium"
                    >
                      Keep newest
                    </button>
                  </div>
                  {group.map((b, bi) => (
                    <div key={b.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${bi !== group.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white/70 truncate">{b.title}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">
                          Added {formatDistanceToNow(new Date(b.createdAt))} ago
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-md text-white/20 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                        <button
                          onClick={() => deleteBookmark(b.id, gi)}
                          disabled={deleting === b.id}
                          className="p-1.5 rounded-md text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors disabled:opacity-50"
                        >
                          {deleting === b.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
