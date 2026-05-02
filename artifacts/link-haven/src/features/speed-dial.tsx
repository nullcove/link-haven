import { Bookmark, Pin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bookmark {
  id: number;
  title: string;
  url: string;
  domain?: string;
  favicon?: string;
  isPinned?: boolean;
}

interface SpeedDialProps {
  bookmarks: Bookmark[];
  onSelect: (b: Bookmark) => void;
}

export function SpeedDial({ bookmarks, onSelect }: SpeedDialProps) {
  const pinned = bookmarks.filter(b => b.isPinned).slice(0, 12);
  if (pinned.length === 0) return null;

  return (
    <div className="mb-6 pb-5 border-b border-white/[0.05]">
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <Pin className="size-3 text-indigo-400" />
        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Pinned</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        {pinned.map(b => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            title={b.title}
            className="group flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-indigo-500/10 border border-white/[0.05] hover:border-indigo-500/20 transition-all"
          >
            <div className="size-9 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center overflow-hidden">
              {b.favicon ? (
                <img
                  src={b.favicon}
                  alt=""
                  className="size-5 object-contain"
                  onError={e => { (e.target as any).style.display = "none"; }}
                />
              ) : (
                <Bookmark className="size-4 text-white/25" />
              )}
            </div>
            <span className="text-[9px] text-white/35 group-hover:text-white/60 text-center line-clamp-1 w-full transition-colors leading-tight">
              {b.domain || b.title.slice(0, 8)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
