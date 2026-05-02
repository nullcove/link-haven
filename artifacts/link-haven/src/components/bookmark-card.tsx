import { Bookmark } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import {
  Link2,
  Image as ImageIcon,
  FileText,
  File,
  Video,
  Star,
  MoreHorizontal,
  Trash2,
  Archive,
  ExternalLink,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const typeIcons = {
  link: Link2,
  article: FileText,
  image: ImageIcon,
  video: Video,
  document: File,
};

const typeColors: Record<string, string> = {
  link: "#6366f1",
  article: "#8b5cf6",
  image: "#10b981",
  video: "#ef4444",
  document: "#f59e0b",
};

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  viewMode: "grid" | "list";
}

export function BookmarkCard({
  bookmark,
  onClick,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  viewMode,
}: BookmarkCardProps) {
  const Icon = typeIcons[bookmark.type as keyof typeof typeIcons] || Link2;
  const accentColor = typeColors[bookmark.type] || "#6366f1";

  const domain = (() => {
    try {
      return bookmark.domain || new URL(bookmark.url).hostname.replace("www.", "");
    } catch {
      return bookmark.url;
    }
  })();

  const ago = (() => {
    try {
      return formatDistanceToNow(new Date(bookmark.createdAt));
    } catch {
      return "";
    }
  })();

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.06] transition-all cursor-pointer"
        onClick={onClick}
        data-testid={`card-bookmark-${bookmark.id}`}
      >
        {/* Favicon */}
        <div className="size-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className="size-4.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Icon className="size-4" style={{ color: accentColor + "99" }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-[13px] font-medium text-white/80 truncate leading-none">
              {bookmark.title || bookmark.url}
            </h3>
            {bookmark.isFavorite && (
              <Star className="size-3 text-amber-400 fill-amber-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/25">
            <Globe className="size-2.5" />
            <span className="truncate">{domain}</span>
            <span>·</span>
            <span>{ago} ago</span>
            {bookmark.collectionName && (
              <>
                <span>·</span>
                <span className="text-indigo-400/60">{bookmark.collectionName}</span>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {bookmark.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-white/30 border border-white/[0.05]"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(bookmark.url, "_blank");
            }}
            className="p-1.5 rounded-md text-white/25 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="size-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1.5 rounded-md transition-colors ${bookmark.isFavorite ? "text-amber-400" : "text-white/25 hover:text-amber-400"} hover:bg-amber-500/5`}
          >
            <Star className={`size-3.5 ${bookmark.isFavorite ? "fill-amber-400" : ""}`} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-1.5 rounded-md text-white/25 hover:text-white/70 hover:bg-white/5 transition-colors">
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36 bg-[#141420] border-white/10 shadow-xl"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArchive();
                }}
                className="text-white/60 hover:text-white text-xs"
              >
                <Archive className="size-3.5 mr-2" />
                {bookmark.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-400/80 hover:text-red-400 focus:bg-red-500/10 text-xs"
              >
                <Trash2 className="size-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      data-testid={`card-bookmark-${bookmark.id}`}
    >
      <div
        className="group h-full overflow-hidden rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-[#0f0f1c] hover:bg-[#111121] transition-all cursor-pointer flex flex-col shadow-sm"
        onClick={onClick}
      >
        {/* Cover / placeholder */}
        <div className="relative aspect-[1.91/1] bg-[#0c0c18] overflow-hidden border-b border-white/[0.04] flex items-center justify-center shrink-0">
          {bookmark.coverImage ? (
            <img
              src={bookmark.coverImage}
              alt={bookmark.title || ""}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `radial-gradient(ellipse at 30% 30%, ${accentColor}12 0%, transparent 70%)`,
              }}
            >
              <Icon className="size-10 opacity-10" style={{ color: accentColor }} />
            </div>
          )}

          {/* Favicon + domain pill */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur border border-white/10 max-w-[calc(100%-1rem)]">
            {bookmark.favicon ? (
              <img
                src={bookmark.favicon}
                className="size-3"
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="size-3 text-white/40" />
            )}
            <span className="text-[10px] text-white/70 truncate font-medium">{domain}</span>
          </div>

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`absolute top-2 right-2 size-6 rounded-full flex items-center justify-center transition-all border ${
              bookmark.isFavorite
                ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                : "bg-black/40 border-white/10 text-white/40 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star
              className={`size-3 ${bookmark.isFavorite ? "fill-amber-400" : ""}`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 flex-1 flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold text-white/85 line-clamp-2 leading-snug group-hover:text-white transition-colors">
            {bookmark.title || bookmark.url}
          </h3>

          {bookmark.description && (
            <p className="text-[11px] text-white/35 line-clamp-2 leading-relaxed">
              {bookmark.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-white/30 border border-white/[0.05]"
              >
                #{tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="text-[10px] text-white/20">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3.5 pb-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5">
          <span className="text-[10px] text-white/20">{ago} ago</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-1 rounded-md text-white/20 hover:text-white/60 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36 bg-[#141420] border-white/10 shadow-xl"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(bookmark.url, "_blank");
                }}
                className="text-white/60 hover:text-white text-xs"
              >
                <ExternalLink className="size-3.5 mr-2" /> Open link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArchive();
                }}
                className="text-white/60 hover:text-white text-xs"
              >
                <Archive className="size-3.5 mr-2" />
                {bookmark.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-400/80 hover:text-red-400 focus:bg-red-500/10 text-xs"
              >
                <Trash2 className="size-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
