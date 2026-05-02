import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListBookmarks, getListBookmarksQueryKey,
  useDeleteBookmark, useToggleFavorite, useToggleArchive,
} from "@workspace/api-client-react";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkDetailDrawer } from "@/components/bookmark-detail-drawer";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { ExportDialog } from "@/features/export-dialog";
import { ImportDialog } from "@/features/import-dialog";
import { DuplicateFinder } from "@/features/duplicate-finder";
import { BrokenLinksChecker } from "@/features/broken-links";
import { AiSearch } from "@/features/ai-search";
import { BulkActionBar } from "@/features/bulk-action-bar";
import {
  LayoutGrid, List, Plus, Search, Bookmark,
  SlidersHorizontal, X, Sparkles, Download, Upload,
  Copy, LinkIcon, ChevronDown, CheckSquare, Square,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortBy = "date" | "title" | "domain";
type SortOrder = "asc" | "desc";

export default function AppPage() {
  const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const view = sp.get("view");
  const tag = sp.get("tag");

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isBrokenOpen, setIsBrokenOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBookmark();
  const favMutation = useToggleFavorite();
  const archiveMutation = useToggleArchive();

  const queryParams = {
    search: search || undefined,
    tag: tag || undefined,
    isFavorite: view === "favorites" ? true : undefined,
    isArchived: view === "archive" ? true : undefined,
    sortBy,
    sortOrder,
  } as any;

  const { data: bookmarks = [], isLoading } = useListBookmarks(queryParams, {
    query: { queryKey: getListBookmarksQueryKey(queryParams) },
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
  }, [queryClient]);

  const pageTitle = view === "favorites" ? "Favourites"
    : view === "archive" ? "Archive"
    : tag ? `#${tag}`
    : "All Bookmarks";

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    invalidate();
    if (selectedBookmark?.id === id) setSelectedBookmark(null);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === bookmarks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bookmarks.map((b: any) => b.id)));
    }
  };

  const SORT_LABELS: Record<string, string> = {
    "date-desc": "Newest first",
    "date-asc": "Oldest first",
    "title-asc": "Title A→Z",
    "title-desc": "Title Z→A",
    "domain-asc": "Domain A→Z",
  };

  return (
    <AppLayout>
      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-[#09090f]/95 backdrop-blur sticky top-0 z-10 shrink-0">
        {/* Title + count */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <h1 className="text-[13px] font-semibold text-white/75 truncate">{pageTitle}</h1>
          {!isLoading && <span className="text-[11px] text-white/20 tabular-nums shrink-0">{bookmarks.length}</span>}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-7 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[12px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.07] transition-colors">
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
                  <DropdownMenuItem
                    key={key}
                    onClick={() => { setSortBy(sb as SortBy); setSortOrder(so as SortOrder); }}
                    className={`text-[12px] rounded-lg cursor-pointer ${active ? "text-indigo-300 bg-indigo-500/10" : "text-white/60 hover:text-white"}`}
                  >
                    {active && <span className="mr-1">✓</span>}{label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <List className="size-3.5" />
            </button>
          </div>

          {/* Select mode */}
          <button
            onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()); }}
            title="Select multiple"
            className={`p-1.5 rounded-lg border transition-colors ${selectMode ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400" : "bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/70"}`}
          >
            <CheckSquare className="size-3.5" />
          </button>

          {/* AI */}
          <button
            onClick={() => setAiOpen(v => !v)}
            title="AI Assistant"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${aiOpen ? "bg-violet-600/20 border-violet-500/30 text-violet-300" : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"}`}
          >
            <Sparkles className="size-3.5" />
            <span className="hidden md:inline">AI Ask</span>
          </button>

          {/* Tools menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.07] transition-colors">
                <span className="hidden sm:inline">Tools</span>
                <ChevronDown className="size-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#131320] border border-white/10 rounded-xl p-1 shadow-2xl">
              <DropdownMenuItem onClick={() => setIsImportOpen(true)} className="text-[12px] text-white/60 hover:text-white rounded-lg cursor-pointer gap-2">
                <Upload className="size-3.5 text-indigo-400" /> Import bookmarks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsExportOpen(true)} className="text-[12px] text-white/60 hover:text-white rounded-lg cursor-pointer gap-2">
                <Download className="size-3.5 text-emerald-400" /> Export bookmarks
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.07] my-1" />
              <DropdownMenuItem onClick={() => setIsDuplicateOpen(true)} className="text-[12px] text-white/60 hover:text-white rounded-lg cursor-pointer gap-2">
                <Copy className="size-3.5 text-orange-400" /> Find duplicates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsBrokenOpen(true)} className="text-[12px] text-white/60 hover:text-white rounded-lg cursor-pointer gap-2">
                <LinkIcon className="size-3.5 text-red-400" /> Check broken links
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold transition-colors shadow-[0_0_20px_rgba(99,102,241,0.25)]"
          >
            <Plus className="size-3.5" /> Add Link
          </button>
        </div>
      </div>

      {/* ── Select bar ─────────────────────────────── */}
      {selectMode && (
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-600/10 border-b border-indigo-500/20 shrink-0">
          <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-[12px] text-indigo-300 hover:text-indigo-200 transition-colors">
            {selectedIds.size === bookmarks.length ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
            {selectedIds.size === bookmarks.length ? "Deselect all" : "Select all"}
          </button>
          <span className="text-[12px] text-indigo-400/60">{selectedIds.size} of {bookmarks.length} selected</span>
          <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} className="ml-auto text-[12px] text-indigo-300/60 hover:text-indigo-300 transition-colors">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ── Content ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="size-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : !bookmarks.length ? (
          <EmptyState search={search} view={view} tag={tag} onAdd={() => setIsAddOpen(true)} />
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 p-5"
              : "flex flex-col gap-0.5 p-4 max-w-4xl"
          }>
            {bookmarks.map((bookmark: any) => (
              <div key={bookmark.id} className="relative">
                {selectMode && (
                  <div
                    className={`absolute top-2 left-2 z-10 size-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                      selectedIds.has(bookmark.id)
                        ? "bg-indigo-600 border-indigo-500"
                        : "bg-black/60 border-white/30 hover:border-indigo-400"
                    }`}
                    onClick={e => { e.stopPropagation(); toggleSelect(bookmark.id); }}
                  >
                    {selectedIds.has(bookmark.id) && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                )}
                <BookmarkCard
                  bookmark={bookmark}
                  viewMode={viewMode}
                  onClick={() => {
                    if (selectMode) { toggleSelect(bookmark.id); return; }
                    setSelectedBookmark(bookmark);
                  }}
                  onToggleFavorite={async () => { await favMutation.mutateAsync({ id: bookmark.id }); invalidate(); }}
                  onToggleArchive={async () => { await archiveMutation.mutateAsync({ id: bookmark.id }); invalidate(); }}
                  onDelete={() => handleDelete(bookmark.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BookmarkDetailDrawer
        bookmark={selectedBookmark}
        open={!!selectedBookmark}
        onOpenChange={o => !o && setSelectedBookmark(null)}
        onDelete={handleDelete}
      />
      <AddBookmarkDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <ExportDialog open={isExportOpen} onOpenChange={setIsExportOpen} />
      <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImported={invalidate} />
      <DuplicateFinder open={isDuplicateOpen} onOpenChange={setIsDuplicateOpen} onDeleted={invalidate} />
      <BrokenLinksChecker open={isBrokenOpen} onOpenChange={setIsBrokenOpen} onDeleted={invalidate} />

      {/* AI panel */}
      {aiOpen && (
        <AiSearch
          bookmarks={bookmarks}
          onSelect={b => { setSelectedBookmark(b); setAiOpen(false); }}
          onClose={() => setAiOpen(false)}
        />
      )}

      {/* Bulk action bar */}
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

function EmptyState({ search, view, tag, onAdd }: {
  search: string; view: string | null; tag: string | null; onAdd: () => void;
}) {
  const msg = search
    ? `No bookmarks found for "${search}"`
    : view === "favorites" ? "You haven't starred any bookmarks yet."
    : view === "archive" ? "Your archive is empty."
    : tag ? `No bookmarks tagged #${tag}.`
    : "Your library is empty. Save your first link!";

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
      <div className="size-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <Bookmark className="size-6 text-indigo-400/50" />
      </div>
      <p className="text-[14px] font-semibold text-white/50 mb-1">Nothing here</p>
      <p className="text-[13px] text-white/25 mb-5 max-w-xs">{msg}</p>
      {!search && !view && !tag && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors"
        >
          <Plus className="size-4" /> Add first link
        </button>
      )}
    </div>
  );
}
