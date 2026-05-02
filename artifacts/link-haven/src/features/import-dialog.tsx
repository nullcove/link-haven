import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileJson, Globe, CheckCircle, AlertCircle } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: (count: number) => void;
}

function parseNetscapeHTML(html: string): Array<{ url: string; title: string; tags: string[] }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = Array.from(doc.querySelectorAll("a"));
  return links
    .filter(a => a.href && a.href.startsWith("http"))
    .map(a => ({
      url: a.getAttribute("href") || a.href,
      title: a.textContent?.trim() || a.href,
      tags: (a.getAttribute("tags") || "").split(",").map(t => t.trim()).filter(Boolean),
    }));
}

function parseJSON(text: string): Array<{ url: string; title?: string; tags?: string[] }> {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data.filter(b => b.url);
  return [];
}

type Status = "idle" | "parsing" | "uploading" | "done" | "error";

export function ImportDialog({ open, onOpenChange, onImported }: ImportDialogProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<{ count: number; format: string } | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("idle");
    setPreview(null);
    setParsedItems([]);
    setError(null);
    setImportedCount(0);
  };

  const handleFile = async (file: File) => {
    reset();
    setStatus("parsing");
    try {
      const text = await file.text();
      let items: any[] = [];
      let format = "";
      if (file.name.endsWith(".json")) {
        items = parseJSON(text);
        format = "JSON";
      } else if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
        items = parseNetscapeHTML(text);
        format = "HTML (Netscape)";
      } else {
        throw new Error("Unsupported format. Please use .json or .html");
      }
      if (items.length === 0) throw new Error("No bookmarks found in this file.");
      setParsedItems(items);
      setPreview({ count: items.length, format });
      setStatus("idle");
    } catch (e: any) {
      setError(e.message || "Failed to parse file");
      setStatus("error");
    }
  };

  const handleImport = async () => {
    if (!parsedItems.length) return;
    setStatus("uploading");
    try {
      const token = getAuthToken();
      const res = await fetch("/api/bookmarks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookmarks: parsedItems }),
      });
      const data = await res.json();
      setImportedCount(data.imported);
      setStatus("done");
      onImported?.(data.imported);
    } catch {
      setError("Import failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md bg-[#0f0f1c] border border-white/[0.09] rounded-2xl p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/[0.07]">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold">
            <Upload className="size-4 text-indigo-400" />
            Import Bookmarks
          </DialogTitle>
          <p className="text-[12px] text-white/40 mt-0.5">Supports Netscape HTML (browser export) and Link Haven JSON</p>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {status === "done" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="size-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3">
                <CheckCircle className="size-7 text-emerald-400" />
              </div>
              <p className="text-[16px] font-bold text-white/80">Imported {importedCount} bookmarks!</p>
              <p className="text-[12px] text-white/35 mt-1">They are now in your library.</p>
              <button
                onClick={() => { reset(); onOpenChange(false); }}
                className="mt-5 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center cursor-pointer transition-all ${
                  dragging
                    ? "border-indigo-500/60 bg-indigo-500/10"
                    : "border-white/[0.10] hover:border-white/20 hover:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".json,.html,.htm"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <div className="flex gap-3 mb-3">
                  <div className="size-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <FileJson className="size-4 text-yellow-400" />
                  </div>
                  <div className="size-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Globe className="size-4 text-blue-400" />
                  </div>
                </div>
                <p className="text-[13px] font-semibold text-white/60">
                  {dragging ? "Drop it here!" : "Drag & drop or click to browse"}
                </p>
                <p className="text-[11px] text-white/30 mt-1">.json · .html · .htm</p>
              </div>

              {/* Tips */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5 text-[11px] text-white/35 space-y-1.5">
                <p className="font-semibold text-white/50 text-[12px] mb-1">How to export from your browser:</p>
                <p>• <strong className="text-white/50">Chrome:</strong> Bookmarks → Bookmark Manager → ⋮ → Export</p>
                <p>• <strong className="text-white/50">Firefox:</strong> Bookmarks → Manage → Import/Export → Export HTML</p>
                <p>• <strong className="text-white/50">Safari:</strong> File → Export → Bookmarks…</p>
              </div>

              {/* Preview */}
              {preview && (
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/25 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-indigo-300">
                      {preview.count} bookmarks found
                    </p>
                    <p className="text-[11px] text-indigo-400/60 mt-0.5">{preview.format} format</p>
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={status === "uploading"}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {status === "uploading" ? "Importing…" : `Import all`}
                  </button>
                </div>
              )}

              {/* Error */}
              {status === "error" && error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-2.5">
                  <AlertCircle className="size-4 text-red-400 shrink-0" />
                  <p className="text-[12px] text-red-400">{error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
