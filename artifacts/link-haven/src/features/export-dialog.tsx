import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileJson, FileText, Globe } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(bookmarks: any[]): string {
  const header = "URL,Title,Description,Domain,Tags,Collection,Favorite,Archived,Created";
  const rows = bookmarks.map(b => [
    `"${b.url}"`,
    `"${(b.title || "").replace(/"/g, '""')}"`,
    `"${(b.description || "").replace(/"/g, '""')}"`,
    `"${b.domain || ""}"`,
    `"${(b.tags || []).join(";")}"`,
    `"${b.collectionName || ""}"`,
    b.isFavorite ? "Yes" : "No",
    b.isArchived ? "Yes" : "No",
    `"${new Date(b.createdAt).toISOString()}"`,
  ].join(","));
  return [header, ...rows].join("\n");
}

function toNetscapeHTML(bookmarks: any[]): string {
  const items = bookmarks.map(b =>
    `    <DT><A HREF="${b.url}" ADD_DATE="${Math.floor(new Date(b.createdAt).getTime() / 1000)}" TAGS="${(b.tags || []).join(",")}">${(b.title || b.url).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</A>`
  ).join("\n");
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${items}
</DL><p>`;
}

const FORMATS = [
  {
    id: "json",
    icon: FileJson,
    label: "JSON",
    desc: "Machine-readable · import back into Link Haven",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    id: "csv",
    icon: FileText,
    label: "CSV",
    desc: "Spreadsheet-friendly · open in Excel / Google Sheets",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "html",
    icon: Globe,
    label: "HTML (Netscape)",
    desc: "Universal format · import into any browser",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
];

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    setLoading(true);
    setDone(null);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/bookmarks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookmarks = await res.json();
      const date = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        downloadFile(JSON.stringify(bookmarks, null, 2), `link-haven-${date}.json`, "application/json");
      } else if (format === "csv") {
        downloadFile(toCSV(bookmarks), `link-haven-${date}.csv`, "text/csv");
      } else {
        downloadFile(toNetscapeHTML(bookmarks), `link-haven-${date}.html`, "text/html");
      }
      setDone(format);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0f0f1c] border border-white/[0.09] rounded-2xl p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/[0.07]">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold">
            <Download className="size-4 text-indigo-400" />
            Export Bookmarks
          </DialogTitle>
          <p className="text-[12px] text-white/40 mt-0.5">Download all your bookmarks in your preferred format</p>
        </DialogHeader>

        <div className="p-5 space-y-2.5">
          {FORMATS.map(({ id, icon: Icon, label, desc, color, bg }) => (
            <button
              key={id}
              onClick={() => handleExport(id)}
              disabled={loading}
              className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border transition-all text-left group disabled:opacity-50 ${
                done === id
                  ? bg + " " + color
                  : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.03]"
              }`}
            >
              <div className={`size-9 rounded-lg border flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`size-4.5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white/80">{label}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
              </div>
              {done === id ? (
                <span className={`text-[11px] font-semibold ${color}`}>Downloaded ✓</span>
              ) : (
                <Download className="size-4 text-white/20 group-hover:text-white/50 transition-colors" />
              )}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-2 rounded-xl border border-white/[0.08] text-[13px] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
