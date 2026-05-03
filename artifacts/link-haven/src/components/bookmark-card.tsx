import { Bookmark } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import {
  Link2, Image as ImageIcon, FileText, File, Video,
  Star, MoreHorizontal, Trash2, Archive, ExternalLink, Globe,
  Pin, StickyNote, Clock, Highlighter, Music,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

/* ─── Type config ─────────────────────────────────────────── */
const TYPE_META: Record<string, { icon: React.ElementType; color: string; grad: string; label: string; emoji: string }> = {
  link:     { icon: Link2,     color: "#6366f1", grad: "from-indigo-600/20 to-violet-600/10",  label: "Link",     emoji: "🔗" },
  article:  { icon: FileText,  color: "#8b5cf6", grad: "from-violet-600/20 to-purple-600/10",  label: "Article",  emoji: "📄" },
  image:    { icon: ImageIcon, color: "#10b981", grad: "from-emerald-600/20 to-teal-600/10",   label: "Image",    emoji: "🖼️" },
  video:    { icon: Video,     color: "#ef4444", grad: "from-red-600/20 to-orange-600/10",     label: "Video",    emoji: "🎬" },
  document: { icon: File,      color: "#f59e0b", grad: "from-amber-600/20 to-yellow-600/10",   label: "Document", emoji: "📑" },
  audio:    { icon: Music,     color: "#06b6d4", grad: "from-cyan-600/20 to-blue-600/10",      label: "Audio",    emoji: "🎵" },
};
const DEFAULT_TYPE = TYPE_META.link;

function getTypeMeta(type?: string) { return TYPE_META[type ?? ""] ?? DEFAULT_TYPE; }

/* ─── 3D type badge chip ──────────────────────────────────── */
function TypeBadge3D({ type }: { type?: string }) {
  const meta = getTypeMeta(type);
  const Ic = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide"
      style={{
        background: `linear-gradient(145deg, ${meta.color}30, ${meta.color}12)`,
        border: `1px solid ${meta.color}30`,
        color: meta.color,
        boxShadow: `0 1px 5px ${meta.color}18, inset 0 1px 0 rgba(255,255,255,.07)`,
      }}
    >
      <Ic style={{ width: 8, height: 8 }} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

/* ─── 3D favicon container ────────────────────────────────── */
function FaviconBox({ bookmark, size = 32 }: { bookmark: any; size?: number }) {
  const meta = getTypeMeta(bookmark.type);
  const Ic = meta.icon;
  return (
    <span
      className="flex items-center justify-center shrink-0 rounded-[10px] relative overflow-hidden"
      style={{
        width: size, height: size,
        background: `linear-gradient(145deg, ${meta.color}28, ${meta.color}0e)`,
        border: `1px solid ${meta.color}25`,
        boxShadow: `0 2px 8px ${meta.color}18, 0 0 0 0.5px ${meta.color}15, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.15)`,
      }}
    >
      <span className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(170deg, rgba(255,255,255,.09) 0%, transparent 50%)", borderRadius: 9 }} />
      {bookmark.favicon
        ? <img src={bookmark.favicon} alt="" style={{ width: size * 0.5, height: size * 0.5 }} className="object-contain relative z-10" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
        : <Ic style={{ width: size * 0.48, height: size * 0.48, color: meta.color, opacity: .85 }} strokeWidth={1.75} className="relative z-10" />}
    </span>
  );
}

/* ─── Action button ───────────────────────────────────────── */
function ActionBtn({ onClick, title, active, activeColor = "text-amber-400", children }: {
  onClick: (e: React.MouseEvent) => void; title: string;
  active?: boolean; activeColor?: string; children: React.ReactNode;
}) {
  return (
    <button title={title} onClick={onClick}
      className={cn("p-1.5 rounded-md transition-all hover:scale-105 active:scale-95", active ? activeColor : "text-white/25 hover:text-white/65 hover:bg-white/[0.06]")}>
      {children}
    </button>
  );
}

/* ─── More menu ───────────────────────────────────────────── */
function MoreMenu({ bookmark, onToggleArchive, onDelete, onPin }: {
  bookmark: any; onToggleArchive?: () => void; onDelete: () => void; onPin?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <button className="p-1.5 rounded-md text-white/25 hover:text-white/65 hover:bg-white/[0.06] transition-all hover:scale-105 active:scale-95">
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 border shadow-2xl rounded-xl p-1"
        style={{ background: "#111118", borderColor: "rgba(255,255,255,.09)" }}>
        <DropdownMenuItem onClick={e => { e.stopPropagation(); window.open(bookmark.url, "_blank"); }}
          className="text-xs text-white/55 hover:text-white rounded-lg cursor-pointer flex items-center gap-2">
          <span className="size-5 rounded-md flex items-center justify-center" style={{ background: "rgba(99,102,241,.2)", border: "1px solid rgba(99,102,241,.25)" }}>
            <ExternalLink className="size-3 text-indigo-400" />
          </span>Open link
        </DropdownMenuItem>
        {onPin && (
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onPin(); }}
            className="text-xs text-white/55 hover:text-white rounded-lg cursor-pointer flex items-center gap-2">
            <span className="size-5 rounded-md flex items-center justify-center" style={{ background: "rgba(139,92,246,.2)", border: "1px solid rgba(139,92,246,.25)" }}>
              <Pin className="size-3 text-violet-400" />
            </span>{bookmark.isPinned ? "Unpin" : "Pin to top"}
          </DropdownMenuItem>
        )}
        {onToggleArchive && (
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onToggleArchive(); }}
            className="text-xs text-white/55 hover:text-white rounded-lg cursor-pointer flex items-center gap-2">
            <span className="size-5 rounded-md flex items-center justify-center" style={{ background: "rgba(100,116,139,.2)", border: "1px solid rgba(100,116,139,.25)" }}>
              <Archive className="size-3 text-slate-400" />
            </span>{bookmark.isArchived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator style={{ background: "rgba(255,255,255,.06)" }} className="my-1" />
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer flex items-center gap-2">
          <span className="size-5 rounded-md flex items-center justify-center" style={{ background: "rgba(239,68,68,.2)", border: "1px solid rgba(239,68,68,.25)" }}>
            <Trash2 className="size-3 text-red-400" />
          </span>Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

export function BookmarkCard({
  bookmark, viewMode, onSelect, onDelete, onFavorite, onArchive, onPin,
  isSelected, onToggleSelect, selectMode,
}: BookmarkCardProps) {
  const meta = getTypeMeta(bookmark.type);
  const bk = bookmark as any;

  const domain = (() => { try { return bookmark.domain || new URL(bookmark.url).hostname.replace("www.", ""); } catch { return bookmark.url; } })();

  const handleClick = () => {
    if (selectMode && onToggleSelect) { onToggleSelect(bookmark.id); return; }
    onSelect(bookmark);
  };

  /* ─── LIST MODE ───────────────────────────────────────── */
  if (viewMode === "list") {
    return (
      <motion.div layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer",
          isSelected ? "bg-indigo-600/10 border-indigo-500/25" : "hover:bg-white/[0.035] border-transparent hover:border-white/[0.07]"
        )}
        onClick={handleClick}>

        {selectMode && (
          <div className={cn("size-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
            isSelected ? "bg-indigo-600 border-indigo-500" : "border-white/25 hover:border-indigo-400")}>
            {isSelected && <span className="text-white text-[9px] font-bold">✓</span>}
          </div>
        )}

        <FaviconBox bookmark={bookmark} size={32} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {bk.isPinned && <Pin className="size-2.5 text-violet-400 shrink-0" />}
            <p className="text-[13px] font-semibold text-white/85 truncate leading-none">{bookmark.title || bookmark.url}</p>
            {bookmark.isFavorite && <Star className="size-3 text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/28">
            <span className="inline-flex items-center gap-1 truncate min-w-0">
              {bookmark.favicon
                ? <img src={bookmark.favicon} className="size-2.5 shrink-0" alt="" onError={e => (e.target as HTMLImageElement).style.display="none"} />
                : <Globe className="size-2.5 shrink-0" />}
              {domain}
            </span>
            {bk.collectionName && <><span className="text-white/10">·</span><span className="text-indigo-400/55 truncate">{bk.collectionName}</span></>}
            {bk.note && <StickyNote className="size-2.5 text-amber-400/40 shrink-0" />}
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 shrink-0">
          <TypeBadge3D type={bookmark.type} />
          {bookmark.tags.slice(0, 2).map((t: string) => (
            <span key={t} className="px-1.5 py-0.5 rounded-md text-[10px] text-white/28 border"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}>
              #{t}
            </span>
          ))}
        </div>

        {bk.readingTime && (
          <span className="hidden lg:flex items-center gap-0.5 text-[10px] text-white/18 shrink-0">
            <Clock className="size-2.5" />{bk.readingTime}m
          </span>
        )}

        <div className="hidden lg:block text-[11px] text-white/18 shrink-0 tabular-nums">
          {(() => { try { return formatDistanceToNow(new Date(bookmark.createdAt)) + " ago"; } catch { return ""; } })()}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <ActionBtn onClick={e => { e.stopPropagation(); window.open(bookmark.url, "_blank"); }} title="Open">
            <ExternalLink className="size-3.5" />
          </ActionBtn>
          <ActionBtn onClick={e => { e.stopPropagation(); onFavorite(bookmark.id); }} title="Favourite" active={bookmark.isFavorite}>
            <Star className={cn("size-3.5", bookmark.isFavorite && "fill-amber-400")} />
          </ActionBtn>
          <MoreMenu bookmark={bk} onToggleArchive={onArchive ? () => onArchive(bookmark.id) : undefined}
            onDelete={() => onDelete(bookmark.id)} onPin={onPin ? () => onPin(bookmark.id) : undefined} />
        </div>
      </motion.div>
    );
  }

  /* ─── GRID MODE ───────────────────────────────────────── */
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
      <div
        className={cn(
          "group h-full rounded-2xl border transition-all cursor-pointer flex flex-col overflow-hidden",
          isSelected ? "border-indigo-500/40 ring-1 ring-indigo-500/20" : "border-white/[0.07] hover:border-white/[0.12]",
          bk.isPinned && "ring-1 ring-violet-500/15"
        )}
        style={{ background: isSelected ? "rgba(99,102,241,.07)" : "linear-gradient(145deg,#0f0f1c,#0c0c18)" }}
        onClick={handleClick}
      >
        {/* Cover */}
        <div className="relative aspect-[1.91/1] overflow-hidden shrink-0 border-b border-white/[0.05]"
          style={{ background: "#0a0a16" }}>
          {bookmark.coverImage ? (
            <img src={bookmark.coverImage} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-[1.04] transition-all duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(ellipse at 40% 35%, ${meta.color}18, transparent 60%)` }}>
              <span className="text-[42px] opacity-[0.12] select-none">{meta.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1c]/85 via-transparent to-transparent" />

          {/* Domain pill */}
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg max-w-[80%]"
            style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.09)" }}>
            {bookmark.favicon
              ? <img src={bookmark.favicon} className="size-3 shrink-0" alt="" onError={e => (e.target as HTMLImageElement).style.display="none"} />
              : <Globe className="size-3 text-white/35 shrink-0" />}
            <span className="text-[10px] text-white/65 truncate font-medium">{domain}</span>
          </div>

          {/* Type badge */}
          <div className="absolute bottom-2 right-2.5">
            <TypeBadge3D type={bookmark.type} />
          </div>

          {/* Pin / Highlight badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {bk.isPinned && (
              <div className="size-6 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(145deg,rgba(139,92,246,.4),rgba(139,92,246,.2))", border: "1px solid rgba(139,92,246,.4)", boxShadow: "0 2px 8px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.1)" }}>
                <Pin className="size-3 text-violet-300" />
              </div>
            )}
            {bk.highlight && (
              <div className="size-6 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(145deg,rgba(245,158,11,.4),rgba(245,158,11,.2))", border: "1px solid rgba(245,158,11,.4)", boxShadow: "0 2px 8px rgba(245,158,11,.25), inset 0 1px 0 rgba(255,255,255,.1)" }}>
                <Highlighter className="size-3 text-amber-300" />
              </div>
            )}
          </div>

          {/* Fav button */}
          <button
            onClick={e => { e.stopPropagation(); onFavorite(bookmark.id); }}
            className={cn(
              "absolute top-2 right-2 size-7 rounded-full flex items-center justify-center transition-all border",
              bookmark.isFavorite
                ? "bg-amber-500/25 border-amber-400/40 text-amber-400"
                : "bg-black/55 border-white/10 text-white/35 opacity-0 group-hover:opacity-100 hover:scale-110"
            )}
            style={bookmark.isFavorite ? { boxShadow: "0 2px 8px rgba(245,158,11,.3)" } : {}}>
            <Star className={cn("size-3.5", bookmark.isFavorite && "fill-amber-400")} />
          </button>

          {/* Select overlay */}
          {selectMode && (
            <div className={cn("absolute top-2 left-2 size-5 rounded-md border-2 flex items-center justify-center transition-all",
              isSelected ? "bg-indigo-600 border-indigo-500" : "bg-black/65 border-white/30")}>
              {isSelected && <span className="text-white text-[9px] font-bold">✓</span>}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3.5 flex-1 flex flex-col min-h-0">
          <h3 className="text-[13px] font-semibold text-white/82 line-clamp-2 leading-snug mb-1.5 group-hover:text-white transition-colors">
            {bookmark.title || bookmark.url}
          </h3>
          {bookmark.description && (
            <p className="text-[11px] text-white/32 line-clamp-2 leading-relaxed mb-2">{bookmark.description}</p>
          )}
          {bk.note && (
            <p className="text-[11px] text-amber-400/45 italic line-clamp-1 mb-1.5">"{bk.note}"</p>
          )}
          {bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {bookmark.tags.slice(0, 3).map((t: string) => (
                <span key={t} className="px-1.5 py-0.5 rounded-md text-[10px] text-white/30 border"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}>
                  #{t}
                </span>
              ))}
              {bookmark.tags.length > 3 && <span className="text-[10px] text-white/18">+{bookmark.tags.length - 3}</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 pb-3 pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/18">
              {(() => { try { return formatDistanceToNow(new Date(bookmark.createdAt)) + " ago"; } catch { return ""; } })()}
            </span>
            {bk.readingTime && (
              <span className="flex items-center gap-0.5 text-[10px] text-white/18">
                <Clock className="size-2.5" />{bk.readingTime}m
              </span>
            )}
            {bk.note && <StickyNote className="size-2.5 text-amber-400/35" />}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionBtn onClick={e => { e.stopPropagation(); window.open(bookmark.url, "_blank"); }} title="Open">
              <ExternalLink className="size-3.5" />
            </ActionBtn>
            <MoreMenu bookmark={bk} onToggleArchive={onArchive ? () => onArchive(bookmark.id) : undefined}
              onDelete={() => onDelete(bookmark.id)} onPin={onPin ? () => onPin(bookmark.id) : undefined} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
