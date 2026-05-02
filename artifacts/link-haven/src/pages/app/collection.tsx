import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListBookmarks, getListBookmarksQueryKey,
  useDeleteBookmark, useToggleFavorite, useToggleArchive,
  useGetCollection, getGetCollectionQueryKey,
  getListCollectionsQueryKey,
} from "@workspace/api-client-react";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkDetailDrawer } from "@/components/bookmark-detail-drawer";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { LayoutGrid, List, Plus, Search, FolderOpen, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";

const COL_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b",
  "#ef4444","#06b6d4","#84cc16","#f97316","#14b8a6",
];

export default function CollectionPage() {
  const [, params] = useRoute("/app/collection/:id");
  const collectionId = params?.id ? parseInt(params.id, 10) : null;

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBookmark();
  const favMutation = useToggleFavorite();
  const archiveMutation = useToggleArchive();

  const { data: collection } = useGetCollection(collectionId || 0, {
    query: { enabled: !!collectionId, queryKey: getGetCollectionQueryKey(collectionId || 0) },
  });

  const queryParams = { search: search || undefined, collectionId: collectionId ?? undefined };
  const { data: bookmarks, isLoading } = useListBookmarks(queryParams, {
    query: { enabled: !!collectionId, queryKey: getListBookmarksQueryKey(queryParams) },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey(collectionId || 0) });
    queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    invalidate();
    if (selectedBookmark?.id === id) setSelectedBookmark(null);
  };

  if (!collectionId) return null;

  const colColor = collection?.color || COL_COLORS[0];

  return (
    <AppLayout>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-[#09090f]/90 backdrop-blur sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-max">
          <div className="size-3.5 rounded-full shrink-0" style={{ backgroundColor: colColor }} />
          <h1 className="text-[14px] font-semibold text-white/80">{collection?.name || "Collection"}</h1>
          {bookmarks && <span className="text-[11px] text-white/20 tabular-nums">{bookmarks.length}</span>}
        </div>

        <div className="relative flex-1 max-w-sm ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search in collection…"
            className="w-full pl-9 pr-8 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <List className="size-3.5" />
            </button>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <Plus className="size-4" /> Add Link
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="size-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : !bookmarks?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="size-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
              <FolderOpen className="size-6 text-white/20" />
            </div>
            <p className="text-[14px] font-semibold text-white/40 mb-1">
              {search ? `No results for "${search}"` : "This collection is empty"}
            </p>
            {!search && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="mt-4 flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors"
              >
                <Plus className="size-4" /> Add first link
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 p-5"
              : "flex flex-col gap-0.5 p-4 max-w-4xl"
          }>
            {bookmarks.map((bookmark: any) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                viewMode={viewMode}
                onClick={() => setSelectedBookmark(bookmark)}
                onToggleFavorite={async () => { await favMutation.mutateAsync({ id: bookmark.id }); invalidate(); }}
                onToggleArchive={async () => { await archiveMutation.mutateAsync({ id: bookmark.id }); invalidate(); }}
                onDelete={() => handleDelete(bookmark.id)}
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
    </AppLayout>
  );
}
