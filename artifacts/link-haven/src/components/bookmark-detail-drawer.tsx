import { Bookmark, useUpdateBookmark, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { ExternalLink, Copy, Star, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "./ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function BookmarkDetailDrawer({ 
  bookmark, 
  open, 
  onOpenChange,
  onDelete
}: { 
  bookmark: Bookmark | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateBookmark();
  const { toast } = useToast();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (bookmark) setNote(bookmark.note || "");
  }, [bookmark]);

  if (!bookmark) return null;

  const handleSaveNote = async () => {
    try {
      await updateMutation.mutateAsync({
        id: bookmark.id,
        data: { note }
      });
      queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
      toast({ title: "Note saved" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await updateMutation.mutateAsync({
        id: bookmark.id,
        data: { isFavorite: !bookmark.isFavorite }
      });
      queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
    } catch (e) {
      console.error(e);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(bookmark.url);
    toast({ title: "URL copied to clipboard" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-[#0a0a0c] border-l border-white/5 p-0 flex flex-col sm:max-w-lg overflow-hidden">
        <div className="h-48 sm:h-64 relative bg-[#111118] shrink-0 border-b border-white/5 flex items-center justify-center">
          {bookmark.coverImage ? (
            <img src={bookmark.coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent opacity-80" />
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            {bookmark.favicon && <img src={bookmark.favicon} className="size-4 rounded-sm" alt="" />}
            <span className="text-sm font-medium text-muted-foreground">{bookmark.domain}</span>
          </div>
          
          <SheetTitle className="text-2xl font-bold leading-tight mb-2 text-foreground">
            {bookmark.title || bookmark.url}
          </SheetTitle>
          
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {bookmark.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant="secondary" className="bg-white/5 hover:bg-white/10" onClick={() => window.open(bookmark.url, '_blank')}>
              <ExternalLink className="size-4 mr-2" /> Open
            </Button>
            <Button variant="secondary" className="bg-white/5 hover:bg-white/10" onClick={copyUrl}>
              <Copy className="size-4 mr-2" /> Copy
            </Button>
            <Button variant="secondary" className={`bg-white/5 hover:bg-white/10 ${bookmark.isFavorite ? 'text-yellow-500' : ''}`} onClick={handleToggleFavorite}>
              <Star className={`size-4 mr-2 ${bookmark.isFavorite ? 'fill-yellow-500' : ''}`} /> Favorite
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Personal Notes</h4>
              <Textarea 
                value={note} 
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                className="min-h-[120px] bg-black/30 border-white/5 focus-visible:border-primary/50 resize-none text-sm"
              />
              {note !== (bookmark.note || "") && (
                <div className="mt-2 flex justify-end">
                  <Button size="sm" onClick={handleSaveNote} disabled={updateMutation.isPending}>
                    Save Note
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-y-4 py-4 border-t border-white/5">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Added</span>
                <span className="text-sm">{format(new Date(bookmark.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Collection</span>
                <span className="text-sm">{bookmark.collectionName || "Unsorted"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground block mb-2">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {bookmark.tags.length > 0 ? bookmark.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  )) : (
                    <span className="text-sm text-white/20">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex justify-end shrink-0 bg-[#0a0a0c]/80 backdrop-blur-md">
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
            onDelete(bookmark.id);
            onOpenChange(false);
          }}>
            <Trash2 className="size-4 mr-2" /> Delete Bookmark
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
