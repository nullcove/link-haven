import { Globe, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { BookmarkCard } from "@/components/bookmark-card";
import { cn } from "@/lib/utils";

interface DomainGroupingProps {
  bookmarks: any[];
  onSelect: (b: any) => void;
  onDelete: (id: number) => void;
  onFavorite: (id: number) => void;
  onArchive: (id: number) => void;
  onSummarize?: (id: number) => Promise<void>;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  selectMode?: boolean;
}

export function DomainGrouping({
  bookmarks, onSelect, onDelete, onFavorite, onArchive, onSummarize,
  selectedIds, onToggleSelect, selectMode,
}: DomainGroupingProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups: Record<string, any[]> = {};
  bookmarks.forEach(b => {
    const domain = b.domain || "Other";
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(b);
  });

  const sorted = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

  const toggle = (domain: string) => {
    setCollapsed(s => {
      const n = new Set(s);
      if (n.has(domain)) n.delete(domain); else n.add(domain);
      return n;
    });
  };

  return (
    <div className="space-y-4">
      {sorted.map(([domain, items]) => {
        const isCollapsed = collapsed.has(domain);
        return (
          <div key={domain} className="rounded-xl border border-white/[0.07] overflow-hidden">
            <button
              onClick={() => toggle(domain)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
            >
              {isCollapsed ? <ChevronRight className="size-3.5 text-white/30" /> : <ChevronDown className="size-3.5 text-white/30" />}
              <Globe className="size-3.5 text-indigo-400" />
              <span className="text-[13px] font-semibold text-white/80">{domain}</span>
              <span className="ml-auto text-[11px] text-white/30 tabular-nums">
                {items.length} bookmark{items.length !== 1 ? "s" : ""}
              </span>
            </button>
            {!isCollapsed && (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 bg-[#08080f]">
                {items.map(b => (
                  <BookmarkCard
                    key={b.id}
                    bookmark={b}
                    viewMode="grid"
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onFavorite={onFavorite}
                    onArchive={onArchive}
                    onSummarize={onSummarize}
                    isSelected={selectedIds?.has(b.id)}
                    onToggleSelect={onToggleSelect}
                    selectMode={selectMode}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
