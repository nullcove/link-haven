import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListBookmarks, getListBookmarksQueryKey,
  useDeleteBookmark, useToggleFavorite, useToggleArchive,
  useGetCollection, getGetCollectionQueryKey,
  getListCollectionsQueryKey, useUpdateBookmark,
} from "@workspace/api-client-react";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkDetailDrawer } from "@/components/bookmark-detail-drawer";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { BulkActionBar } from "@/features/bulk-action-bar";
import {
  LayoutGrid, List, Plus, Search, FolderOpen, X,
  SlidersHorizontal, ChevronDown, CheckSquare, Square,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortBy = "date" | "title" | "domain";
type SortOrder = "asc" | "desc";

const COL_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b",
  "#ef4444","#06b6d4","#84cc16","#f97316","#14b8a6",
];

const SORT_LABELS: Record<string, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "title-asc": "Title A→Z",
  "title-desc": "Title Z→A",
  "domain-asc": "Domain A→Z",
};

export default function CollectionPage() {
  const [, params] = useRoute("/app/collection/:id");
  const collectionId = params?.id ? parseInt(params.id, 10) : null;

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBookmark();
  const favMutation = useToggleFavorite();
  const archiveMutation = useToggleArchive();
  const updateMutation = useUpdateBookmark();

  const { data: collection } = useGetCollection(collectionId || 0, {
    query: { enabled: !!collectionId, queryKey: getGetCollectionQueryKey(collectionId || 0) },
  });

  const queryParams = {
    search: search || undefined,
    collectionId: collectionId ?? undefined,
    sortBy, sortOrder,
  } as any;

  const { data: bookmarks = [], isLoading } = useListBookmarks(queryParams, {
    query: { enabled: !!collectionId, queryKey: getListBookmarksQueryKey(queryParams) },
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey(collectionId || 0) });
    queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
  }, [queryClient, collectionId]);

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    invalidate();
    if (selectedBookmark?.id === id) setSelectedBookmark(null);
  };

  const handlePin = async (id: number) => {
    const bk = (bookmarks as any[]).find(b => b.id === id);
    await updateMutation.mutateAsync({ id, data: { isPinned: !bk?.isPinned } as any });
    invalidate();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === bookmarks.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(bookmarks.map((b: any) => b.id)));
  };

  if (!collectionId) return null;
  const colColor = collection?.color || COL_COLORS[0];

  return (
    <AppLayout>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] sticky top-0 z-10 shrink-0" style={{ background: "rgba(7,7,14,.88)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="size-3.5 rounded-full shrink-0" style={{ backgroundColor: colColor }} />
          <h1 className="text-[13px] font-semibold text-white/75">{collection?.name || "Collection"}</h1>
          {!isLoading && <span className="text-[11px] text-white/20 tabular-nums">{bookmarks.length}</span>}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/25 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search in collection…"
            className="w-full pl-8 pr-7 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[12px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 hover:text-white/80 transition-colors">
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">{SORT_LABELS[`${sortBy}-${sortOrder}`] || "Sort"}</span>
                <ChevronDown className="size-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-[#131320] border border-white/10 rounded-xl p-1 shadow-2xl">
              {Object.entries(SORT_LABELS).map(([key, label]) => {
                const [sb, so] = key.split("-");
                const active = sortBy === sb && sortOrder === so;
                return (
                  <DropdownMenuItem key={key} onClick={() => { setSortBy(sb as SortBy); setSortOrder(so as SortOrder); }}
                    className={`text-[12px] rounded-lg cursor-pointer ${active ? "text-indigo-300 bg-indigo-500/10" : "text-white/60 hover:text-white"}`}>
                    {active && <span className="mr-1">✓</span>}{label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <List className="size-3.5" />
            </button>
          </div>

          <button onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()); }}
            className={`p-1.5 rounded-lg border transition-colors ${selectMode ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400" : "bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/70"}`}>
            <CheckSquare className="size-3.5" />
          </button>

          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold transition-colors">
            <Plus className="size-3.5" /> Add Link
          </button>
        </div>
      </div>

      {selectMode && (
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-600/10 border-b border-indigo-500/20 shrink-0">
          <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-[12px] text-indigo-300 hover:text-indigo-200 transition-colors">
            {selectedIds.size === bookmarks.length ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
            {selectedIds.size === bookmarks.length ? "Deselect all" : "Select all"}
          </button>
          <span className="text-[12px] text-indigo-400/60">{selectedIds.size} of {bookmarks.length} selected</span>
          <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} className="ml-auto text-[12px] text-indigo-300/60 hover:text-indigo-300">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="size-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : !bookmarks.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="size-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
              <FolderOpen className="size-6 text-white/20" />
            </div>
            <p className="text-[14px] font-semibold text-white/40 mb-1">{search ? `No results for "${search}"` : "This collection is empty"}</p>
            {!search && (
              <button onClick={() => setIsAddOpen(true)} className="mt-4 flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors">
                <Plus className="size-4" /> Add first link
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 p-5"
            : "flex flex-col gap-0.5 p-4 max-w-4xl"
          }>
            {bookmarks.map((bookmark: any) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                viewMode={viewMode}
                onSelect={b => { if (selectMode) { toggleSelect(b.id); return; } setSelectedBookmark(b); }}
                onFavorite={async (id) => { await favMutation.mutateAsync({ id }); invalidate(); }}
                onArchive={async (id) => { await archiveMutation.mutateAsync({ id }); invalidate(); }}
                onDelete={handleDelete}
                onPin={handlePin}
                isSelected={selectedIds.has(bookmark.id)}
                onToggleSelect={toggleSelect}
                selectMode={selectMode}
              />
            ))}
          </div>
        )}
      </div>

      <BookmarkDetailDrawer
        bookmark={selectedBookmark}
        open={!!selectedBookmark}
        onOpenChange={o => !o && setSelectedBookmark(null)}
        onDelete={handleDelete}
      />
      <AddBookmarkDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

      {selectMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={Array.from(selectedIds)}
          onClear={() => setSelectedIds(new Set())}
          onDone={() => { setSelectedIds(new Set()); setSelectMode(false); invalidate(); }}
        />
      )}
    </AppLayout>
  );
}
