import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateBookmark, useListCollections,
  getListCollectionsQueryKey, getListBookmarksQueryKey, getGetStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, Tag, FolderOpen, Plus } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  url: z.string().url("Please enter a valid URL"),
  title: z.string().optional(),
  collectionId: z.string().optional(),
  tags: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AddBookmarkDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateBookmark();
  const [error, setError] = useState<string | null>(null);

  const { data: collections } = useListCollections({ query: { queryKey: getListCollectionsQueryKey() } });

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedCol = watch("collectionId");

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const tags = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      await createMutation.mutateAsync({
        data: {
          url: data.url,
          title: data.title || null,
          description: data.description || null,
          collectionId: data.collectionId && data.collectionId !== "none"
            ? parseInt(data.collectionId, 10) : null,
          tags,
          type: "link",
        },
      });
      queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      reset();
      onOpenChange(false);
    } catch {
      setError("Failed to save. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); setError(null); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md bg-[#0f0f1c] border border-white/[0.09] text-white rounded-2xl p-0 overflow-hidden gap-0 shadow-2xl">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/[0.07]">
          <DialogTitle className="text-[15px] font-semibold text-white flex items-center gap-2">
            <div className="size-6 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Plus className="size-3.5 text-indigo-400" />
            </div>
            Save a link
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          {/* URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">URL *</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/30" />
              <input
                {...register("url")}
                autoFocus
                placeholder="https://example.com"
                className="w-full pl-8 pr-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
            {errors.url && <p className="text-[11px] text-red-400">{errors.url.message}</p>}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Title <span className="normal-case text-white/20">(auto-detected)</span></label>
            <input
              {...register("title")}
              placeholder="Leave blank to use page title"
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
            />
          </div>

          {/* Collection + Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider flex items-center gap-1">
                <FolderOpen className="size-3" /> Collection
              </label>
              <select
                value={selectedCol || "none"}
                onChange={e => setValue("collectionId", e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-xl text-[13px] text-white/70 outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="none" className="bg-[#0f0f1c]">Unsorted</option>
                {collections?.map(c => (
                  <option key={c.id} value={c.id.toString()} className="bg-[#0f0f1c]">{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider flex items-center gap-1">
                <Tag className="size-3" /> Tags
              </label>
              <input
                {...register("tags")}
                placeholder="design, tools…"
                className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Note</label>
            <textarea
              {...register("description")}
              placeholder="Optional description or note…"
              rows={2}
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all resize-none"
            />
          </div>

          {error && <p className="text-[12px] text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { reset(); setError(null); onOpenChange(false); }}
              className="px-4 py-2 rounded-xl text-[13px] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {createMutation.isPending ? (
                <><span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
              ) : (
                <><Plus className="size-3.5" /> Save Link</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
