import { Bookmark, ListBookmarksParams } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Link2, Image as ImageIcon, FileText, File, Video, Star, MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const typeIcons = {
  link: Link2,
  article: FileText,
  image: ImageIcon,
  video: Video,
  document: File,
};

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
}

export function BookmarkCard({ bookmark, onClick, onToggleFavorite, onDelete, viewMode }: BookmarkCardProps) {
  const Icon = typeIcons[bookmark.type as keyof typeof typeIcons] || Link2;

  if (viewMode === 'list') {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
        onClick={onClick}
      >
        <div className="size-10 rounded bg-white/5 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="size-5" />
          ) : (
            <Icon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">{bookmark.title || bookmark.url}</h3>
            {bookmark.isFavorite && <Star className="size-3 text-yellow-500 fill-yellow-500" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground truncate">{bookmark.domain || new URL(bookmark.url).hostname}</span>
            <span className="text-xs text-white/20">&bull;</span>
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(bookmark.createdAt))} ago</span>
            {bookmark.collectionName && (
              <>
                <span className="text-xs text-white/20">&bull;</span>
                <span className="text-xs text-primary/70">{bookmark.collectionName}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="size-8 h-8 w-8 text-muted-foreground hover:text-yellow-500" onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
            <Star className={`size-4 ${bookmark.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="size-8 h-8 w-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 border-white/10 bg-[#141419] shadow-xl">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 size-4" /> Delete
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="group h-full overflow-hidden bg-[#1a1a24]/50 border-white/5 hover:border-primary/30 transition-colors cursor-pointer shadow-lg backdrop-blur-sm flex flex-col"
        onClick={onClick}
      >
        <div className="relative aspect-[1.91/1] bg-[#111118] overflow-hidden border-b border-white/5 flex shrink-0 items-center justify-center">
          {bookmark.coverImage ? (
            <img src={bookmark.coverImage} alt={bookmark.title || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
              <Icon className="size-12 text-primary/20" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className="size-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-yellow-400 hover:bg-black/60 transition-colors border border-white/10"
            >
              <Star className={`size-3.5 ${bookmark.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 max-w-[calc(100%-1rem)]">
            {bookmark.favicon ? (
              <img src={bookmark.favicon} className="size-3.5" alt="" />
            ) : (
              <Icon className="size-3.5 text-white/70" />
            )}
            <span className="text-xs font-medium text-white/90 truncate">{bookmark.domain || new URL(bookmark.url).hostname}</span>
          </div>
        </div>
        
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {bookmark.title || bookmark.url}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 mt-auto">
            {bookmark.description || "No description provided."}
          </p>
          <div className="flex flex-wrap gap-1 mt-auto shrink-0">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-[10px] px-1.5 py-0 border-white/5 text-muted-foreground font-normal">
                #{tag}
              </Badge>
            ))}
            {bookmark.tags.length > 3 && (
              <Badge variant="secondary" className="bg-transparent text-[10px] px-1 py-0 text-muted-foreground">
                +{bookmark.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
