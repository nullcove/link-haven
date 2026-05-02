import { Clock, Bookmark, Star, Archive, Pin, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  bookmarks: any[];
  onSelect: (b: any) => void;
  limit?: number;
}

export function RecentActivity({ bookmarks, onSelect, limit = 10 }: RecentActivityProps) {
  const recent = [...bookmarks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  if (recent.length === 0) return null;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Clock className="size-3.5 text-indigo-400" />
        <h3 className="text-[13px] font-semibold text-white/80">Recent Activity</h3>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {recent.map(b => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors text-left"
          >
            <div className="size-7 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
              {b.favicon ? (
                <img src={b.favicon} alt="" className="size-4 object-contain" onError={e => { (e.target as any).style.display = "none"; }} />
              ) : <Bookmark className="size-3 text-white/25" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white/75 truncate">{b.title}</p>
              <p className="text-[10px] text-white/25">{b.domain}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {b.isFavorite && <Star className="size-2.5 text-amber-400/60" />}
              {b.isPinned && <Pin className="size-2.5 text-indigo-400/60" />}
              {b.isArchived && <Archive className="size-2.5 text-white/25" />}
              <span className="text-[10px] text-white/20 whitespace-nowrap">
                {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
