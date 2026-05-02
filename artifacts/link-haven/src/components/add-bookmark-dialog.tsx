import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateBookmark, useListCollections, getListCollectionsQueryKey, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().optional(),
  collectionId: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddBookmarkDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateBookmark();
  
  const { data: collections } = useListCollections({
    query: { queryKey: getListCollectionsQueryKey() }
  });

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const tagsArray = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      
      await createMutation.mutateAsync({
        data: {
          url: data.url,
          title: data.title || null,
          collectionId: data.collectionId ? parseInt(data.collectionId, 10) : null,
          tags: tagsArray,
          type: "link"
        }
      });
      
      // Invalidate bookmark lists
      queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
      reset();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#141419] border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle>Save Bookmark</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new link to your sanctuary. We'll try to fetch the details automatically.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input 
              {...register("url")} 
              placeholder="https://example.com" 
              className="bg-black/50 border-white/10 focus-visible:border-primary"
              autoFocus
            />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>

          <div className="space-y-2">
            <Input 
              {...register("title")} 
              placeholder="Custom title (optional)" 
              className="bg-black/50 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Select onValueChange={(val) => setValue("collectionId", val)}>
                <SelectTrigger className="bg-black/50 border-white/10">
                  <SelectValue placeholder="Collection" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  <SelectItem value="0">Unsorted</SelectItem>
                  {collections?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Input 
                {...register("tags")} 
                placeholder="Tags (comma separated)" 
                className="bg-black/50 border-white/10"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90">
              {createMutation.isPending ? "Saving..." : "Save Link"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
