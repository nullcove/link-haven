import { X, ExternalLink, Clock, Bookmark, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Bookmark {
  id: number;
  title: string;
  url: string;
  domain?: string;
  favicon?: string;
  description?: string;
  tags?: string[];
  note?: string;
  readingTime?: number;
  isFavorite?: boolean;
  isArchived?: boolean;
}

interface FocusModeProps {
  bookmarks: Bookmark[];
  onClose: () => void;
}

function ReadingCard({ b, onRead }: { b: Bookmark; onRead: (id: number) => void }) {
  const [read, setRead] = useState(false);

  const handle = () => {
    setRead(true);
    setTimeout(() => onRead(b.id), 600);
    window.open(b.url, "_blank", "noopener");
  };

  const rt = b.readingTime ?? Math.ceil(Math.random() * 8 + 2);

  return (
    <div className={cn(
      "group rounded-2xl border p-5 transition-all duration-500 cursor-pointer",
      read
        ? "bg-emerald-500/5 border-emerald-500/20 opacity-50"
        : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.05] hover:border-indigo-500/20"
    )} onClick={handle}>
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
          {b.favicon ? (
            <img src={b.favicon} alt="" className="size-5 object-contain" onError={e => { (e.target as any).style.display = "none"; }} />
          ) : <Bookmark className="size-4 text-white/30" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[14px] text-white/90 group-hover:text-white line-clamp-2 leading-snug">{b.title}</h3>
          {b.description && <p className="text-[12px] text-white/40 mt-1 line-clamp-2">{b.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-white/25">{b.domain}</span>
            <span className="text-[11px] text-white/20">•</span>
            <span className="flex items-center gap-1 text-[11px] text-white/25">
              <Clock className="size-2.5" />
              {rt} min read
            </span>
          </div>
        </div>
        <div className={cn(
          "size-7 rounded-full border flex items-center justify-center shrink-0 transition-all",
          read
            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
            : "border-white/[0.08] text-white/20 group-hover:border-indigo-500/30 group-hover:text-indigo-400"
        )}>
          {read ? <Check className="size-3.5" /> : <ExternalLink className="size-3.5" />}
        </div>
      </div>
      {b.note && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-white/35 italic">
          "{b.note}"
        </div>
      )}
    </div>
  );
}

export function FocusMode({ bookmarks, onClose }: FocusModeProps) {
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const unread = bookmarks.filter(b => !b.isArchived && !readIds.has(b.id)).slice(0, 20);
  const totalRead = readIds.size;
  const totalTime = unread.reduce((s, b) => s + (b.readingTime ?? 5), 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#08080f] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#08080f]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="font-bold text-[16px] text-white">Reading List</h1>
            <p className="text-[11px] text-white/30">
              {unread.length} to read • ~{totalTime} min total • {totalRead} done this session
            </p>
          </div>

          {/* Progress bar */}
          {bookmarks.length > 0 && (
            <div className="w-32 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(totalRead / Math.max(totalRead + unread.length, 1)) * 100}%` }}
              />
            </div>
          )}

          <button
            onClick={onClose}
            className="size-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-3">
        {unread.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">Reading list complete!</h2>
            <p className="text-white/40 text-sm">You've gone through all your bookmarks this session.</p>
            <button onClick={onClose} className="mt-6 px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-600/30 transition-colors">
              Back to Library
            </button>
          </div>
        ) : (
          unread.map(b => (
            <ReadingCard key={b.id} b={b} onRead={id => setReadIds(s => new Set(s).add(id))} />
          ))
        )}
      </div>
    </div>
  );
}
