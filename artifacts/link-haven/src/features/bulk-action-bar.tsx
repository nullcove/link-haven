import { Trash2, Star, Archive, FolderOpen, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { getAuthToken } from "@/lib/auth";
import { useListCollections, getListCollectionsQueryKey } from "@workspace/api-client-react";

interface BulkActionBarProps {
  selectedIds: number[];
  onClear: () => void;
  onDone: () => void;
}

export function BulkActionBar({ selectedIds, onClear, onDone }: BulkActionBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const { data: collections } = useListCollections({ query: { queryKey: getListCollectionsQueryKey() } });

  const bulkUpdate = async (update: object) => {
    const token = getAuthToken();
    await fetch("/api/bookmarks/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: selectedIds, update }),
    });
    onDone();
  };

  const bulkDelete = async () => {
    const ok = confirm(`Delete ${selectedIds.length} bookmarks? This cannot be undone.`);
    if (!ok) return;
    setLoading("delete");
    try {
      const token = getAuthToken();
      await fetch("/api/bookmarks/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: selectedIds }),
      });
      onDone();
    } finally {
      setLoading(null);
    }
  };

  const action = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    try { await fn(); }
    finally { setLoading(null); setShowMoveMenu(false); }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      {showMoveMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoveMenu(false)}
        />
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#1a1a2e] border border-white/[0.12] shadow-2xl shadow-black/50">
        {/* Count */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 mr-1">
          <span className="text-[13px] font-bold text-indigo-300">{selectedIds.length}</span>
          <span className="text-[11px] text-indigo-400/60">selected</span>
        </div>

        {/* Favorite */}
        <ActionBtn
          onClick={() => action("fav", () => bulkUpdate({ isFavorite: true }))}
          loading={loading === "fav"}
          title="Mark favourite"
        >
          <Star className="size-3.5" />
          <span className="hidden sm:inline text-[12px]">Favourite</span>
        </ActionBtn>

        {/* Archive */}
        <ActionBtn
          onClick={() => action("arch", () => bulkUpdate({ isArchived: true }))}
          loading={loading === "arch"}
          title="Archive"
        >
          <Archive className="size-3.5" />
          <span className="hidden sm:inline text-[12px]">Archive</span>
        </ActionBtn>

        {/* Move */}
        <div className="relative">
          <ActionBtn
            onClick={() => setShowMoveMenu(v => !v)}
            loading={loading === "move"}
            title="Move to collection"
          >
            <FolderOpen className="size-3.5" />
            <span className="hidden sm:inline text-[12px]">Move</span>
          </ActionBtn>
          {showMoveMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#131320] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-1">
                <button
                  onClick={() => action("move", () => bulkUpdate({ collectionId: null }))}
                  className="w-full text-left px-3 py-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                >
                  Unsorted
                </button>
                {collections?.map(c => (
                  <button
                    key={c.id}
                    onClick={() => action("move", () => bulkUpdate({ collectionId: c.id }))}
                    className="w-full text-left px-3 py-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08]" />

        {/* Delete */}
        <button
          onClick={bulkDelete}
          disabled={!!loading}
          title="Delete selected"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.10] transition-colors disabled:opacity-50"
        >
          {loading === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          <span className="hidden sm:inline text-[12px]">Delete</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08]" />

        {/* Clear */}
        <button
          onClick={onClear}
          title="Deselect all"
          className="p-1.5 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </>
  );
}

function ActionBtn({ onClick, loading, title, children }: {
  onClick: () => void;
  loading?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!!loading}
      title={title}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white/50 hover:text-white/90 hover:bg-white/[0.08] transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : children}
    </button>
  );
}
