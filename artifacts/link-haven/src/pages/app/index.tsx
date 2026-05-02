import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListBookmarks,
  getListBookmarksQueryKey,
  useDeleteBookmark,
  useToggleFavorite,
  useToggleArchive,
} from "@workspace/api-client-react";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkDetailDrawer } from "@/components/bookmark-detail-drawer";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List, Plus, Search, Bookmark } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AppPage() {
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const view = searchParams.get("view");
  const tag = searchParams.get("tag");

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBookmark();
  const favMutation = useToggleFavorite();
  const archiveMutation = useToggleArchive();

  const queryParams = {
    search: search || undefined,
    tag: tag || undefined,
    isFavorite: view === "favorites" ? true : undefined,
    isArchived: view === "archive" ? true : undefined,
  };

  const { data: bookmarks, isLoading } = useListBookmarks(queryParams, {
    query: { queryKey: getListBookmarksQueryKey(queryParams) },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });

  const getPageTitle = () => {
    if (view === "favorites") return "Favourites";
    if (view === "archive") return "Archive";
    if (tag) return `#${tag}`;
    return "All Bookmarks";
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    invalidate();
    if (selectedBookmark?.id === id) setSelectedBookmark(null);
  };

  const handleToggleFavorite = async (bookmark: any) => {
    await favMutation.mutateAsync({ id: bookmark.id });
    invalidate();
  };

  const handleToggleArchive = async (bookmark: any) => {
    await archiveMutation.mutateAsync({ id: bookmark.id });
    invalidate();
  };

  return (
    <AppLayout>
      {/* Top header */}
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-5 gap-3 bg-[#080810]/95 backdrop-blur sticky top-0 z-10">
        <h1 className="font-semibold text-[15px] text-white/90 min-w-max">{getPageTitle()}</h1>

        <div className="flex-1 max-w-sm ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks..."
            data-testid="input-search-bookmarks"
            className="w-full pl-9 bg-white/[0.04] border-white/5 focus-visible:border-indigo-500/40 h-9 rounded-full text-sm placeholder:text-white/25"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-white/8 rounded-lg p-0.5 bg-white/[0.03]">
          <button
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
          >
            <List className="size-3.5" />
          </button>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          size="sm"
          data-testid="button-add-bookmark"
          className="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] border-0"
        >
          <Plus className="size-4" /> Add Link
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 md:p-7">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="size-7 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : !bookmarks?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="size-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Bookmark className="size-6 text-indigo-400/50" />
            </div>
            <h3 className="text-base font-semibold text-white/60 mb-1">Nothing here yet</h3>
            <p className="text-sm text-white/30 mb-5 max-w-xs">
              {search
                ? "No bookmarks matched your search."
                : "Add your first link to get started."}
            </p>
            {!search && (
              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-0"
              >
                Add first link
              </Button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-1.5 max-w-4xl"
            }
          >
            {bookmarks.map((bookmark: any) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                viewMode={viewMode}
                onClick={() => setSelectedBookmark(bookmark)}
                onToggleFavorite={() => handleToggleFavorite(bookmark)}
                onToggleArchive={() => handleToggleArchive(bookmark)}
                onDelete={() => handleDelete(bookmark.id)}
              />
            ))}
          </div>
        )}
      </div>

      <BookmarkDetailDrawer
        bookmark={selectedBookmark}
        open={!!selectedBookmark}
        onOpenChange={(o) => !o && setSelectedBookmark(null)}
        onDelete={handleDelete}
      />
      <AddBookmarkDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </AppLayout>
  );
}
