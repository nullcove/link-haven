import { Bookmark } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import {
  Link2, Image as ImageIcon, FileText, File, Video,
  Star, MoreHorizontal, Trash2, Archive, ExternalLink, Globe,
  Pin, StickyNote, Clock, Highlighter,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  link: "#6366f1", article: "#8b5cf6", image: "#10b981", video: "#ef4444", document: "#f59e0b", audio: "#06b6d4",
};
const TYPE_ICONS = { link: Link2, article: FileText, image: ImageIcon, video: Video, document: File, audio: File };

interface BookmarkCardProps {
  bookmark: Bookmark & { isPinned?: boolean; note?: string; highlight?: string; readingTime?: number; summary?: string };
  viewMode: "grid" | "list";
  onSelect: (b: any) => void;
  onDelete: (id: number) => void;
  onFavorite: (id: number) => void;
  onArchive?: (id: number) => void;
  onPin?: (id: number) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  selectMode?: boolean;
}

function Domain({ bookmark }: { bookmark: any }) {
  const domain = (() => {
    try { return bookmark.domain || new URL(bookmark.url).hostname.replace("www.", ""); }
    catch { return bookmark.url; }
  })();
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-white/30 truncate min-w-0">
      {bookmark.favicon
        ? <img src={bookmark.favicon} className="size-3 shrink-0" alt="" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
        : <Globe className="size-3 shrink-0" />}
      {domain}
    </span>
  );
}

function TimeAgo({ date }: { date: string }) {
  try { return <span>{formatDistanceToNow(new Date(date))} ago</span>; }
  catch { return null; }
}

function ReadingTime({ url, readingTime }: { url: string; readingTime?: number }) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) return null;
  const minutes = readingTime ?? null;
  if (!minutes) return null;
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-white/20">
      <Clock className="size-2.5" />{minutes}m
    </span>
  );
}

export function BookmarkCard({
  bookmark, viewMode, onSelect, onDelete, onFavorite, onArchive, onPin,
  isSelected, onToggleSelect, selectMode,
}: BookmarkCardProps) {
  const Icon = TYPE_ICONS[bookmark.type as keyof typeof TYPE_ICONS] || Link2;
  const accent = TYPE_COLORS[bookmark.type] || "#6366f1";
  const bk = bookmark as any;

  const handleClick = () => {
    if (selectMode && onToggleSelect) { onToggleSelect(bookmark.id); return; }
    onSelect(bookmark);
  };

  /* ─── LIST MODE ─────────────────────────────────────── */
  if (viewMode === "list") {
    return (
      <motion.div
        layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer",
          isSelected
            ? "bg-indigo-600/10 border-indigo-500/25"
            : "hover:bg-white/[0.04] border-transparent hover:border-white/[0.07]"
        )}
        onClick={handleClick}
      >
        {/* Select checkbox */}
        {selectMode && (
          <div className={cn(
            "size-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
            isSelected ? "bg-indigo-600 border-indigo-500" : "border-white/25 hover:border-indigo-400"
          )}>
            {isSelected && <span className="text-white text-[9px] font-bold">✓</span>}
          </div>
        )}

        {/* Favicon */}
        <div className="size-8 rounded-md bg-[#1a1a2e] border border-white/[0.07] flex items-center justify-center shrink-0">
          {bookmark.favicon
            ? <img src={bookmark.favicon} alt="" className="size-4" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
            : <Icon className="size-3.5" style={{ color: accent + "99" }} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {bk.isPinned && <Pin className="size-2.5 text-indigo-400 shrink-0" />}
            <p className="text-[13px] font-medium text-white/85 truncate leading-none">{bookmark.title || bookmark.url}</p>
            {bookmark.isFavorite && <Star className="size-3 text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/30">
            <Domain bookmark={bookmark} />
            {bk.collectionName && <><span className="text-white/15">·</span><span className="text-indigo-400/60 truncate">{bk.collectionName}</span></>}
            {bk.note && <StickyNote className="size-2.5 text-amber-400/40 shrink-0" />}
          </div>
        </div>

        {/* Tags */}
        <div className="hidden xl:flex items-center gap-1 shrink-0">
          {bookmark.tags.slice(0, 2).map((t: string) => (
            <span key={t} className="px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] text-white/30 border border-white/[0.05]">#{t}</span>
          ))}
        </div>

        {/* Reading time */}
        <div className="hidden lg:block shrink-0">
          <ReadingTime url={bookmark.url} readingTime={bk.readingTime} />
        </div>

        {/* Date */}
        <div className="hidden lg:block text-[11px] text-white/20 shrink-0 tabular-nums">
          <TimeAgo date={bookmark.createdAt} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <ActionBtn onClick={e => { e.stopPropagation(); window.open(bookmark.url, "_blank"); }} title="Open link">
            <ExternalLink className="size-3.5" />
          </ActionBtn>
          <ActionBtn onClick={e => { e.stopPropagation(); onFavorite(bookmark.id); }} title="Favourite" active={bookmark.isFavorite} activeColor="text-amber-400">
            <Star className={`size-3.5 ${bookmark.isFavorite ? "fill-amber-400" : ""}`} />
          </ActionBtn>
          <MoreMenu bookmark={bk} onToggleArchive={onArchive ? () => onArchive(bookmark.id) : undefined} onDelete={() => onDelete(bookmark.id)} onPin={onPin ? () => onPin(bookmark.id) : undefined} />
        </div>
      </motion.div>
    );
  }

  /* ─── GRID MODE ─────────────────────────────────────── */
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
      <div
        className={cn(
          "group h-full rounded-xl border bg-[#0f0f1c] hover:border-indigo-500/20 hover:bg-[#11111f] transition-all cursor-pointer flex flex-col overflow-hidden",
          isSelected ? "border-indigo-500/40 ring-1 ring-indigo-500/20" : "border-white/[0.07]",
          bk.isPinned && "ring-1 ring-indigo-500/10"
        )}
        onClick={handleClick}
      >
        {/* Cover */}
        <div className="relative aspect-[1.91/1] bg-[#0c0c18] overflow-hidden shrink-0 border-b border-white/[0.05]">
          {bookmark.coverImage ? (
            <img src={bookmark.coverImage} alt="" className="w-full h-full object-cover opacity-75 group-hover:opacity-95 group-hover:scale-[1.03] transition-all duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(ellipse at 40% 40%, ${accent}15 0%, transparent 65%)` }}>
              <Icon className="size-9 opacity-[0.08]" style={{ color: accent }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1c]/80 via-transparent to-transparent" />

          {/* Domain pill */}
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-black/55 backdrop-blur border border-white/10 max-w-[80%]">
            {bookmark.favicon
              ? <img src={bookmark.favicon} className="size-3 shrink-0" alt="" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
              : <Globe className="size-3 text-white/40 shrink-0" />}
            <span className="text-[10px] text-white/70 truncate font-medium">
              {(() => { try { return bookmark.domain || new URL(bookmark.url).hostname.replace("www.", ""); } catch { return ""; } })()}
            </span>
          </div>

          {/* Badges top-left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {bk.isPinned && (
              <div className="size-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center backdrop-blur">
                <Pin className="size-3 text-indigo-400" />
              </div>
            )}
            {bk.highlight && (
              <div className="size-6 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center backdrop-blur">
                <Highlighter className="size-3 text-amber-400" />
              </div>
            )}
          </div>

          {/* Fav button */}
          <button
            onClick={e => { e.stopPropagation(); onFavorite(bookmark.id); }}
            className={`absolute top-2 right-2 size-7 rounded-full flex items-center justify-center transition-all border ${
              bookmark.isFavorite
                ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                : "bg-black/50 border-white/10 text-white/40 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star className={`size-3.5 ${bookmark.isFavorite ? "fill-amber-400" : ""}`} />
          </button>

          {/* Select overlay */}
          {selectMode && (
            <div className={cn(
              "absolute top-2 left-2 size-5 rounded-md border-2 flex items-center justify-center transition-all",
              isSelected ? "bg-indigo-600 border-indigo-500" : "bg-black/60 border-white/30"
            )}>
              {isSelected && <span className="text-white text-[9px] font-bold">✓</span>}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3.5 flex-1 flex flex-col min-h-0">
          <h3 className="text-[13px] font-semibold text-white/85 line-clamp-2 leading-snug mb-1.5 group-hover:text-white transition-colors">
            {bookmark.title || bookmark.url}
          </h3>
          {bookmark.description && (
            <p className="text-[11px] text-white/35 line-clamp-2 leading-relaxed mb-2">{bookmark.description}</p>
          )}
          {bk.note && (
            <p className="text-[11px] text-amber-400/50 italic line-clamp-1 mb-1.5">"{bk.note}"</p>
          )}

          {/* Tags */}
          {bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {bookmark.tags.slice(0, 3).map((t: string) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.05] text-[10px] text-white/35">#{t}</span>
              ))}
              {bookmark.tags.length > 3 && <span className="text-[10px] text-white/20">+{bookmark.tags.length - 3}</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 pb-3 pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/20"><TimeAgo date={bookmark.createdAt} /></span>
            <ReadingTime url={bookmark.url} readingTime={bk.readingTime} />
            {bk.note && <StickyNote className="size-2.5 text-amber-400/40" />}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionBtn onClick={e => { e.stopPropagation(); window.open(bookmark.url, "_blank"); }} title="Open">
              <ExternalLink className="size-3.5" />
            </ActionBtn>
            <MoreMenu bookmark={bk} onToggleArchive={onArchive ? () => onArchive(bookmark.id) : undefined} onDelete={() => onDelete(bookmark.id)} onPin={onPin ? () => onPin(bookmark.id) : undefined} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({ onClick, title, active, activeColor, children }: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  active?: boolean;
  activeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${active ? activeColor || "text-indigo-400" : "text-white/30 hover:text-white/70 hover:bg-white/[0.06]"}`}
    >
      {children}
    </button>
  );
}

function MoreMenu({ bookmark, onToggleArchive, onDelete, onPin }: {
  bookmark: any;
  onToggleArchive?: () => void;
  onDelete: () => void;
  onPin?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <button className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-[#131320] border border-white/10 shadow-2xl rounded-lg p-1">
        <DropdownMenuItem
          onClick={e => { e.stopPropagation(); window.open(bookmark.url, "_blank"); }}
          className="text-xs text-white/60 hover:text-white rounded-md cursor-pointer"
        >
          <ExternalLink className="size-3.5 mr-2" /> Open link
        </DropdownMenuItem>
        {onPin && (
          <DropdownMenuItem
            onClick={e => { e.stopPropagation(); onPin(); }}
            className="text-xs text-white/60 hover:text-white rounded-md cursor-pointer"
          >
            <Pin className="size-3.5 mr-2 text-indigo-400" />
            {bookmark.isPinned ? "Unpin" : "Pin to top"}
          </DropdownMenuItem>
        )}
        {onToggleArchive && (
          <DropdownMenuItem
            onClick={e => { e.stopPropagation(); onToggleArchive(); }}
            className="text-xs text-white/60 hover:text-white rounded-md cursor-pointer"
          >
            <Archive className="size-3.5 mr-2" />
            {bookmark.isArchived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/[0.07] my-1" />
        <DropdownMenuItem
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer"
        >
          <Trash2 className="size-3.5 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
