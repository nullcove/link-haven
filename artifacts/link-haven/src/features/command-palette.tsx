import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ExternalLink, Bookmark, Star, Archive, Hash, FolderOpen, Plus, Download, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bookmark {
  id: number;
  title: string;
  url: string;
  domain?: string;
  favicon?: string;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  collectionName?: string;
}

interface Action {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  onAction: () => void;
}

interface CommandPaletteProps {
  bookmarks: Bookmark[];
  onSelect: (b: Bookmark) => void;
  onClose: () => void;
  onAddBookmark?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

export function CommandPalette({
  bookmarks, onSelect, onClose, onAddBookmark, onExport, onImport,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase().trim();

  const filtered = q.length > 0
    ? bookmarks.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.domain?.toLowerCase().includes(q) ||
        b.url?.toLowerCase().includes(q) ||
        b.tags?.some(t => t.toLowerCase().includes(q)) ||
        b.collectionName?.toLowerCase().includes(q)
      ).slice(0, 8)
    : bookmarks.slice(0, 5);

  const actions: Action[] = [
    { id: "add", label: "Add Bookmark", description: "Save a new link", icon: <Plus className="size-3.5" />, shortcut: "N", onAction: () => { onClose(); onAddBookmark?.(); } },
    { id: "export", label: "Export Bookmarks", description: "Download your library", icon: <Download className="size-3.5" />, shortcut: "E", onAction: () => { onClose(); onExport?.(); } },
    { id: "import", label: "Import Bookmarks", description: "Upload from browser", icon: <Upload className="size-3.5" />, shortcut: "I", onAction: () => { onClose(); onImport?.(); } },
  ];

  const visibleActions = q ? actions.filter(a => a.label.toLowerCase().includes(q)) : actions;
  const total = filtered.length + visibleActions.length;

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, total - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter") {
      if (cursor < filtered.length) onSelect(filtered[cursor]);
      else visibleActions[cursor - filtered.length]?.onAction();
    }
  }, [cursor, filtered, visibleActions, total, onSelect, onClose]);

  useEffect(() => { setCursor(0); }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[580px] mx-4 bg-[#0d0d1a] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]">
          <Search className="size-4 text-white/30 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search bookmarks or type a command…"
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/25 hover:text-white/50">
              <X className="size-3.5" />
            </button>
          )}
          <kbd className="hidden sm:flex text-[10px] text-white/25 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">

          {/* Bookmarks */}
          {filtered.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-4 py-1.5">
                {q ? "Bookmarks" : "Recent"}
              </p>
              {filtered.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => { onSelect(b); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    cursor === i ? "bg-indigo-500/10" : "hover:bg-white/[0.03]"
                  )}
                >
                  <div className="size-8 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                    {b.favicon ? (
                      <img src={b.favicon} alt="" className="size-4 object-contain" onError={e => { (e.target as any).style.display = "none"; }} />
                    ) : <Bookmark className="size-3.5 text-white/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/85 truncate">{b.title}</p>
                    <p className="text-[11px] text-white/30 truncate">{b.domain || b.url}</p>
                  </div>
                  {b.isFavorite && <Star className="size-3 text-yellow-400/60 shrink-0" />}
                  <ExternalLink className="size-3 text-white/20 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          {visibleActions.length > 0 && (
            <div>
              {filtered.length > 0 && <div className="h-px bg-white/[0.05] mx-4 my-2" />}
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-4 py-1.5">
                Actions
              </p>
              {visibleActions.map((a, i) => (
                <button
                  key={a.id}
                  onClick={a.onAction}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    cursor === filtered.length + i ? "bg-indigo-500/10" : "hover:bg-white/[0.03]"
                  )}
                >
                  <div className="size-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-white/40 shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/80">{a.label}</p>
                    {a.description && <p className="text-[11px] text-white/30">{a.description}</p>}
                  </div>
                  {a.shortcut && (
                    <kbd className="text-[10px] text-white/25 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5">
                      ⌘{a.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}

          {q && filtered.length === 0 && visibleActions.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-white/25">
              No results for "{query}"
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-4 py-2 flex items-center gap-4 text-[10px] text-white/20">
          <span><kbd className="text-white/30">↑↓</kbd> navigate</span>
          <span><kbd className="text-white/30">↵</kbd> select</span>
          <span><kbd className="text-white/30">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
