import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListBookmarks, getListBookmarksQueryKey,
  useDeleteBookmark, useToggleFavorite, useToggleArchive, useUpdateBookmark,
} from "@workspace/api-client-react";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkDetailDrawer } from "@/components/bookmark-detail-drawer";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { AdvancedFilters, FilterState, DEFAULT_FILTERS, countActiveFilters, applyFilters } from "@/features/advanced-filters";
import { SpeedDial } from "@/features/speed-dial";

const ExportDialog      = lazy(() => import("@/features/export-dialog").then(m => ({ default: m.ExportDialog })));
const ImportDialog      = lazy(() => import("@/features/import-dialog").then(m => ({ default: m.ImportDialog })));
const DuplicateFinder   = lazy(() => import("@/features/duplicate-finder").then(m => ({ default: m.DuplicateFinder })));
const BrokenLinksChecker= lazy(() => import("@/features/broken-links").then(m => ({ default: m.BrokenLinksChecker })));
const AiSearch          = lazy(() => import("@/features/ai-search").then(m => ({ default: m.AiSearch })));
const BulkActionBar     = lazy(() => import("@/features/bulk-action-bar").then(m => ({ default: m.BulkActionBar })));
const CommandPalette    = lazy(() => import("@/features/command-palette").then(m => ({ default: m.CommandPalette })));
const DomainGrouping    = lazy(() => import("@/features/domain-grouping").then(m => ({ default: m.DomainGrouping })));
const FocusMode         = lazy(() => import("@/features/focus-mode").then(m => ({ default: m.FocusMode })));
import {
  LayoutGrid, List, Plus, Search, Bookmark,
  SlidersHorizontal, X, Sparkles, Download, Upload,
  Copy, LinkIcon, ChevronDown, CheckSquare, Square,
  Filter, Globe, BookOpen, Command, Zap,
} from "lucide-react";
import { ClayDot } from "@/components/ui/clay-icon";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SortBy = "date" | "title" | "domain";
type SortOrder = "asc" | "desc";
type ViewLayout = "grid" | "list" | "domain";

export default function AppPage() {
  const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const view = sp.get("view");
  const tag = sp.get("tag");

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [viewLayout, setViewLayout] = useState<ViewLayout>("grid");
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
  const [cmdOpen, setCmdOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [focusMode, setFocusMode] = useState(false);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBookmark();
  const favMutation = useToggleFavorite();
  const archiveMutation = useToggleArchive();
  const updateMutation = useUpdateBookmark();

  const queryParams = {
    search: search || undefined,
    tag: tag || undefined,
    isFavorite: view === "favorites" ? true : undefined,
    isArchived: view === "archive" ? true : undefined,
    sortBy, sortOrder,
  } as any;

  const { data: rawBookmarks = [], isLoading } = useListBookmarks(queryParams, {
    query: { queryKey: getListBookmarksQueryKey(queryParams) },
  });

  // Client-side filters applied on top
  const bookmarks = applyFilters(
    view === "pinned" ? (rawBookmarks as any[]).filter((b: any) => b.isPinned) : rawBookmarks as any[],
    filters
  );

  // Domain view
  const domainBookmarks = view === "domains" ? rawBookmarks as any[] : bookmarks;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
  }, [queryClient]);

  const pageTitle = view === "favorites" ? "Favourites"
    : view === "archive" ? "Archive"
    : view === "pinned" ? "Pinned"
    : view === "recent" ? "Recent"
    : view === "domains" ? "By Domain"
    : tag ? `#${tag}`
    : "All Bookmarks";

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    invalidate();
    if (selectedBookmark?.id === id) setSelectedBookmark(null);
  };

  const handlePin = async (id: number) => {
    const bk = (rawBookmarks as any[]).find((b: any) => b.id === id);
    await updateMutation.mutateAsync({ id, data: { isPinned: !bk?.isPinned } as any });
    invalidate();
  };

  const handleSummarize = async (id: number) => {
    const { getAuthToken } = await import("@/lib/auth");
    const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
    const resp = await fetch(`${BASE}/api/bookmarks/${id}/summarize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!resp.ok) {
      const err = await resp.json() as any;
      throw new Error(err.error || "Summarization failed");
    }
    invalidate();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === bookmarks.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(bookmarks.map((b: any) => b.id)));
  };

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); setIsAddOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeFilterCount = countActiveFilters(filters);

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
      <div className="relative flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] sticky top-0 z-20 shrink-0" style={{ background: "rgba(7,7,14,.88)", backdropFilter: "blur(20px)" }}>
        {/* Title */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <h1 className="text-[13px] font-semibold text-white/75 truncate">{pageTitle}</h1>
          {!isLoading && (
            <span className="text-[11px] text-white/20 tabular-nums shrink-0">
              {bookmarks.length}{rawBookmarks.length !== bookmarks.length && ` of ${rawBookmarks.length}`}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search… (⌘K for palette)"
            className="w-full pl-8 pr-7 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[12px] text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {/* Filter */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={cn(
              "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors",
              filtersOpen || activeFilterCount > 0
                ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"
            )}
          >
            <Filter className="size-3.5" />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 hover:text-white/80 transition-colors">
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">{SORT_LABELS[`${sortBy}-${sortOrder}`] || "Sort"}</span>
                <ChevronDown className="size-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl shadow-2xl border"
              style={{ background: "rgba(10,10,18,.96)", borderColor: "rgba(255,255,255,.1)", backdropFilter: "blur(20px)", boxShadow: "0 20px 50px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.06)" }}>
              {Object.entries(SORT_LABELS).map(([key, label]) => {
                const [sb, so] = key.split("-");
                const active = sortBy === sb && sortOrder === so;
                return (
                  <DropdownMenuItem key={key} onClick={() => { setSortBy(sb as SortBy); setSortOrder(so as SortOrder); }}
                    className="rounded-xl cursor-pointer px-3 py-2 flex items-center gap-2.5 outline-none"
                    style={{ background: active ? "rgba(99,102,241,.14)" : "transparent", color: active ? "#a5b4fc" : "rgba(255,255,255,.55)" }}>
                    {active && (
                      <span className="size-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,.75) 0%, #818cf8 35%, #6366f1 70%)", boxShadow: "0 2px 8px rgba(99,102,241,.5)" }}>
                        <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                    {!active && <span className="size-4 shrink-0" />}
                    <span className="text-[12px] font-medium">{label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            <button onClick={() => setViewLayout("grid")} title="Grid" className={`p-1.5 rounded-md transition-colors ${viewLayout === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button onClick={() => setViewLayout("list")} title="List" className={`p-1.5 rounded-md transition-colors ${viewLayout === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <List className="size-3.5" />
            </button>
            <button onClick={() => setViewLayout("domain")} title="Group by domain" className={`p-1.5 rounded-md transition-colors ${viewLayout === "domain" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              <Globe className="size-3.5" />
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

          {/* Focus mode */}
          <button
            onClick={() => setFocusMode(true)}
            title="Reading list / Focus mode"
            className="p-1.5 rounded-lg border bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
          >
            <BookOpen className="size-3.5" />
          </button>

          {/* Command palette */}
          <button
            onClick={() => setCmdOpen(true)}
            title="Command palette (⌘K)"
            className="hidden md:flex items-center gap-1 p-1.5 rounded-lg border bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/70 transition-colors"
          >
            <Command className="size-3.5" />
          </button>

          {/* AI search */}
          <button
            onClick={() => setAiOpen(v => !v)}
            title="Semantic AI search"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${aiOpen ? "bg-violet-600/20 border-violet-500/30 text-violet-300" : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"}`}
          >
            <Sparkles className="size-3.5" />
            <span className="hidden md:inline">AI Ask</span>
          </button>

          {/* Tools menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 hover:text-white/80 transition-colors">
                <Zap className="size-3.5" />
                <span className="hidden sm:inline">Tools</span>
                <ChevronDown className="size-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-2xl shadow-2xl border"
              style={{ background: "rgba(10,10,18,.96)", borderColor: "rgba(255,255,255,.1)", backdropFilter: "blur(20px)", boxShadow: "0 20px 50px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.06)" }}>
              <DropdownMenuItem onClick={() => setIsImportOpen(true)}
                className="rounded-xl cursor-pointer px-3 py-2.5 flex items-center gap-2.5 outline-none group"
                style={{ color: "rgba(255,255,255,.55)" }}>
                <ClayDot icon={Upload} color="#6366f1" size={22} />
                <span className="text-[12px] font-medium group-hover:text-white transition-colors">Import bookmarks</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsExportOpen(true)}
                className="rounded-xl cursor-pointer px-3 py-2.5 flex items-center gap-2.5 outline-none group"
                style={{ color: "rgba(255,255,255,.55)" }}>
                <ClayDot icon={Download} color="#10b981" size={22} />
                <span className="text-[12px] font-medium group-hover:text-white transition-colors">Export bookmarks</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5" style={{ background: "rgba(255,255,255,.06)" }} />
              <DropdownMenuItem onClick={() => setIsDuplicateOpen(true)}
                className="rounded-xl cursor-pointer px-3 py-2.5 flex items-center gap-2.5 outline-none group"
                style={{ color: "rgba(255,255,255,.55)" }}>
                <ClayDot icon={Copy} color="#f97316" size={22} />
                <span className="text-[12px] font-medium group-hover:text-white transition-colors">Find duplicates</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsBrokenOpen(true)}
                className="rounded-xl cursor-pointer px-3 py-2.5 flex items-center gap-2.5 outline-none group"
                style={{ color: "rgba(255,255,255,.55)" }}>
                <ClayDot icon={LinkIcon} color="#ef4444" size={22} />
                <span className="text-[12px] font-medium group-hover:text-white transition-colors">Check broken links</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold transition-colors shadow-[0_0_20px_rgba(99,102,241,0.25)]"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </div>

        {/* Advanced filters dropdown */}
        {filtersOpen && (
          <AdvancedFilters
            filters={filters}
            onChange={setFilters}
            onClose={() => setFiltersOpen(false)}
          />
        )}
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
      <div className="flex-1 overflow-y-auto" style={{ background: "transparent" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="size-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : !rawBookmarks.length ? (
          <EmptyState search={search} view={view} tag={tag} onAdd={() => setIsAddOpen(true)} />
        ) : (
          <div className="p-5">
            {/* Speed Dial — pinned bookmarks */}
            {!search && !view && !tag && (
              <SpeedDial
                bookmarks={rawBookmarks as any}
                onSelect={b => { window.open(b.url, "_blank", "noopener"); }}
              />
            )}

            {/* Domain grouping view */}
            {viewLayout === "domain" ? (
              <Suspense fallback={null}>
                <DomainGrouping
                  bookmarks={bookmarks}
                  onSelect={b => { if (selectMode) { toggleSelect(b.id); return; } setSelectedBookmark(b); }}
                  onDelete={handleDelete}
                  onFavorite={async (id) => { await favMutation.mutateAsync({ id }); invalidate(); }}
                  onArchive={async (id) => { await archiveMutation.mutateAsync({ id }); invalidate(); }}
                  onSummarize={handleSummarize}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  selectMode={selectMode}
                />
              </Suspense>
            ) : (
              <div className={
                viewLayout === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5"
                  : "flex flex-col gap-0.5 max-w-4xl"
              }>
                {bookmarks.map((bookmark: any) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    viewMode={viewLayout === "list" ? "list" : "grid"}
                    onSelect={b => {
                      if (selectMode) { toggleSelect(b.id); return; }
                      setSelectedBookmark(b);
                    }}
                    onDelete={handleDelete}
                    onFavorite={async (id) => { await favMutation.mutateAsync({ id }); invalidate(); }}
                    onArchive={async (id) => { await archiveMutation.mutateAsync({ id }); invalidate(); }}
                    onPin={handlePin}
                    onSummarize={handleSummarize}
                    isSelected={selectedIds.has(bookmark.id)}
                    onToggleSelect={toggleSelect}
                    selectMode={selectMode}
                  />
                ))}
              </div>
            )}

            {bookmarks.length === 0 && rawBookmarks.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Filter className="size-8 text-white/15 mb-3" />
                <p className="text-[13px] text-white/35 mb-2">No bookmarks match your filters</p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
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
      <Suspense fallback={null}>
        {isExportOpen && <ExportDialog open={isExportOpen} onOpenChange={setIsExportOpen} />}
        {isImportOpen && <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImported={invalidate} />}
        {isDuplicateOpen && <DuplicateFinder open={isDuplicateOpen} onOpenChange={setIsDuplicateOpen} onDeleted={invalidate} />}
        {isBrokenOpen && <BrokenLinksChecker open={isBrokenOpen} onOpenChange={setIsBrokenOpen} onDeleted={invalidate} />}
        {aiOpen && (
          <AiSearch
            bookmarks={rawBookmarks as any}
            onSelect={b => { setSelectedBookmark(b); setAiOpen(false); }}
            onClose={() => setAiOpen(false)}
          />
        )}
        {cmdOpen && (
          <CommandPalette
            bookmarks={rawBookmarks as any}
            onSelect={b => setSelectedBookmark(b)}
            onClose={() => setCmdOpen(false)}
            onAddBookmark={() => setIsAddOpen(true)}
            onExport={() => setIsExportOpen(true)}
            onImport={() => setIsImportOpen(true)}
          />
        )}
        {focusMode && (
          <FocusMode
            bookmarks={rawBookmarks as any}
            onClose={() => setFocusMode(false)}
          />
        )}
        {selectMode && selectedIds.size > 0 && (
          <BulkActionBar
            selectedIds={Array.from(selectedIds)}
            onClear={() => setSelectedIds(new Set())}
            onDone={() => { setSelectedIds(new Set()); setSelectMode(false); invalidate(); }}
          />
        )}
      </Suspense>
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
    : view === "pinned" ? "No pinned bookmarks yet. Pin a bookmark to keep it at the top."
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
        <button onClick={onAdd} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors">
          <Plus className="size-4" /> Add first link
        </button>
      )}
    </div>
  );
}
