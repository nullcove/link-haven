import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListBookmarks, getListBookmarksQueryKey, useDeleteBookmark, useUpdateBookmark, useGetCollection, getGetCollectionQueryKey } from "@workspace/api-client-react";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkDetailDrawer } from "@/components/bookmark-detail-drawer";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List, Plus, Search, Folder } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";

export default function CollectionPage() {
  const [, params] = useRoute("/app/collection/:id");
  const collectionId = params?.id ? parseInt(params.id, 10) : null;
  
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBookmark();
  const updateMutation = useUpdateBookmark();

  const { data: collection } = useGetCollection(collectionId || 0, {
    query: { enabled: !!collectionId, queryKey: getGetCollectionQueryKey(collectionId || 0) }
  });

  const queryParams = {
    search: search || undefined,
    collectionId: collectionId
  };

  const { data: bookmarks, isLoading } = useListBookmarks(queryParams, {
    query: { enabled: !!collectionId, queryKey: getListBookmarksQueryKey(queryParams) }
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey(collectionId || 0) });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async (bookmark: any) => {
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

  if (!collectionId) return null;

  return (
    <AppLayout>
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-4 gap-4 bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div 
            className="size-3 rounded-full" 
            style={{ backgroundColor: collection?.color || 'hsl(var(--primary))' }}
          />
          <h1 className="font-semibold text-lg">{collection?.name || 'Loading...'}</h1>
        </div>
        
        <div className="flex-1 max-w-md ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in collection..." 
            className="w-full pl-9 bg-black/20 border-white/5 focus-visible:border-primary/50 h-9 rounded-full"
          />
        </div>

        <div className="flex items-center gap-1 border border-white/10 rounded-md p-0.5 bg-black/20">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`size-7 h-7 w-7 rounded-sm ${viewMode === 'grid' ? 'bg-white/10 shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`size-7 h-7 w-7 rounded-sm ${viewMode === 'list' ? 'bg-white/10 shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="size-4" />
          </Button>
        </div>

        <Button onClick={() => setIsAddOpen(true)} size="sm" className="h-9 gap-1.5 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          <Plus className="size-4" /> Add Link
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-background to-[#0a0a0c]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : bookmarks?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Folder className="size-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-medium mb-2">Empty Collection</h3>
            <p className="text-muted-foreground mb-6">
              {search ? "No bookmarks matched your search." : "This collection doesn't have any bookmarks yet."}
            </p>
            {!search && (
              <Button onClick={() => setIsAddOpen(true)}>Add your first link here</Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            : "flex flex-col gap-2 max-w-5xl mx-auto"
          }>
            {bookmarks?.map((bookmark: any) => (
              <BookmarkCard 
                key={bookmark.id}
                bookmark={bookmark}
                viewMode={viewMode}
                onClick={() => setSelectedBookmark(bookmark)}
                onToggleFavorite={() => handleToggleFavorite(bookmark)}
                onDelete={() => handleDelete(bookmark.id)}
              />
            ))}
          </div>
        )}
      </div>

      <BookmarkDetailDrawer 
        bookmark={selectedBookmark} 
        open={!!selectedBookmark} 
        onOpenChange={(o) => !o && setSelectedBookmark(null)}
        onDelete={handleDelete}
      />
      <AddBookmarkDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </AppLayout>
  );
}
