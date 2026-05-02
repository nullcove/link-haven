import { Bookmark, useUpdateBookmark, useToggleFavorite, useToggleArchive, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent } from "./ui/sheet";
import { format } from "date-fns";
import { ExternalLink, Copy, Star, Trash2, Archive, Globe, X, Hash, Calendar, FolderOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "./ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function BookmarkDetailDrawer({
  bookmark, open, onOpenChange, onDelete,
}: {
  bookmark: Bookmark | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateBookmark();
  const favMutation = useToggleFavorite();
  const archiveMutation = useToggleArchive();
  const { toast } = useToast();
  const [note, setNote] = useState("");

  useEffect(() => { if (bookmark) setNote(bookmark.note || ""); }, [bookmark]);

  if (!bookmark) return null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });

  const handleSaveNote = async () => {
    await updateMutation.mutateAsync({ id: bookmark.id, data: { note } });
    invalidate();
    toast({ title: "Note saved" });
  };

  const domain = (() => { try { return bookmark.domain || new URL(bookmark.url).hostname.replace("www.", ""); } catch { return ""; } })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] bg-[#0c0c14] border-l border-white/[0.07] p-0 flex flex-col overflow-hidden gap-0"
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-20 size-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <X className="size-3.5" />
        </button>

        {/* Cover */}
        <div className="relative h-44 shrink-0 bg-[#0f0f1e] overflow-hidden">
          {bookmark.coverImage ? (
            <img src={bookmark.coverImage} alt="" className="w-full h-full object-cover opacity-70" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-violet-900/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-[#0c0c14]/40 to-transparent" />

          {/* Favicon + Domain */}
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
            {bookmark.favicon
              ? <img src={bookmark.favicon} className="size-4 rounded-sm" alt="" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
              : <Globe className="size-4 text-white/40" />}
            <span className="text-[12px] text-white/60 font-medium">{domain}</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Title */}
            <h2 className="text-[17px] font-bold text-white leading-snug mb-2">
              {bookmark.title || bookmark.url}
            </h2>

            {/* Description */}
            {bookmark.description && (
              <p className="text-[13px] text-white/45 leading-relaxed mb-4">{bookmark.description}</p>
            )}

            {/* Action row */}
            <div className="flex items-center gap-2 mb-5">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-medium transition-colors"
              >
                <ExternalLink className="size-3.5" /> Open link
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(bookmark.url); toast({ title: "Copied!" }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white/60 hover:text-white text-[12px] transition-colors"
              >
                <Copy className="size-3.5" /> Copy URL
              </button>
              <button
                onClick={async () => { await favMutation.mutateAsync({ id: bookmark.id }); invalidate(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-colors ${bookmark.isFavorite ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-white/[0.06] border-white/[0.08] text-white/60 hover:text-amber-400 hover:bg-amber-500/10"}`}
              >
                <Star className={`size-3.5 ${bookmark.isFavorite ? "fill-amber-400" : ""}`} />
              </button>
              <button
                onClick={async () => { await archiveMutation.mutateAsync({ id: bookmark.id }); invalidate(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white/60 hover:text-white text-[12px] transition-colors"
              >
                <Archive className="size-3.5" />
              </button>
            </div>

            {/* Meta */}
            <div className="space-y-3 mb-5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <MetaRow icon={Calendar} label="Added">
                {format(new Date(bookmark.createdAt), "MMM d, yyyy")}
              </MetaRow>
              {bookmark.collectionName && (
                <MetaRow icon={FolderOpen} label="Collection">
                  {bookmark.collectionName}
                </MetaRow>
              )}
              {bookmark.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1.5 w-24 shrink-0 pt-0.5">
                    <Hash className="size-3.5 text-white/25" />
                    <span className="text-[11px] text-white/30">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {bookmark.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300/80">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-white/50">Personal note</p>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Write a note about this link…"
                className="min-h-[100px] bg-white/[0.04] border border-white/[0.08] focus-visible:border-indigo-500/40 resize-none text-[13px] text-white/70 placeholder:text-white/20 rounded-xl"
              />
              {note !== (bookmark.note || "") && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={updateMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-medium transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Saving…" : "Save note"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete footer */}
        <div className="border-t border-white/[0.06] p-4 shrink-0">
          <button
            onClick={() => { onDelete(bookmark.id); onOpenChange(false); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08] border border-transparent hover:border-red-500/20 text-[13px] transition-all"
          >
            <Trash2 className="size-3.5" /> Delete bookmark
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetaRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-24 shrink-0">
        <Icon className="size-3.5 text-white/25" />
        <span className="text-[11px] text-white/30">{label}</span>
      </div>
      <span className="text-[12px] text-white/60">{children}</span>
    </div>
  );
}
