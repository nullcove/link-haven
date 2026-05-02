import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagCloudProps {
  bookmarks: any[];
  onTagClick: (tag: string) => void;
  activeTag?: string;
}

export function TagCloud({ bookmarks, onTagClick, activeTag }: TagCloudProps) {
  const tagMap: Record<string, number> = {};
  bookmarks.forEach(b => b.tags?.forEach((t: string) => { tagMap[t] = (tagMap[t] || 0) + 1; }));

  const entries = Object.entries(tagMap).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  const max = entries[0][1];
  const min = entries[entries.length - 1][1];

  const getSize = (count: number) => {
    const pct = max === min ? 0.5 : (count - min) / (max - min);
    if (pct > 0.8) return "text-[16px] font-bold opacity-100";
    if (pct > 0.6) return "text-[14px] font-semibold opacity-90";
    if (pct > 0.4) return "text-[12px] font-medium opacity-80";
    if (pct > 0.2) return "text-[11px] font-normal opacity-65";
    return "text-[10px] font-normal opacity-45";
  };

  const COLORS = [
    "text-indigo-300 hover:text-indigo-200",
    "text-violet-300 hover:text-violet-200",
    "text-blue-300 hover:text-blue-200",
    "text-cyan-300 hover:text-cyan-200",
    "text-purple-300 hover:text-purple-200",
    "text-fuchsia-300 hover:text-fuchsia-200",
    "text-teal-300 hover:text-teal-200",
    "text-sky-300 hover:text-sky-200",
  ];

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="size-4 text-indigo-400" />
        <h3 className="text-[13px] font-semibold text-white/80">Tag Cloud</h3>
        <span className="ml-auto text-[11px] text-white/25">{entries.length} tags</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2.5 leading-relaxed">
        {entries.slice(0, 50).map(([tag, count], i) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className={cn(
              "flex items-center gap-0.5 transition-all hover:scale-105",
              getSize(count),
              activeTag === tag
                ? "text-white bg-indigo-500/20 rounded px-1.5 -mx-1.5"
                : COLORS[i % COLORS.length]
            )}
            title={`${count} bookmark${count !== 1 ? "s" : ""}`}
          >
            <Hash className="size-2.5 opacity-60" />
            {tag}
            <span className="text-[9px] opacity-50 ml-0.5">({count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
