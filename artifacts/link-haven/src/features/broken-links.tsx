import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LinkIcon, Loader2, CheckCircle, XCircle, ExternalLink, Trash2, AlertTriangle } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface BrokenLinksProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

type CheckResult = {
  id: number;
  url: string;
  title: string;
  status: number;
  ok: boolean;
};

export function BrokenLinksChecker({ open, onOpenChange, onDeleted }: BrokenLinksProps) {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setChecked(false);
    setResults([]);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/bookmarks", { headers: { Authorization: `Bearer ${token}` } });
      const bookmarks = await res.json();
      const ids = bookmarks.map((b: any) => b.id);
      setTotal(ids.length);
      setProgress(0);

      // Send in batches of 20
      const batchSize = 20;
      const allResults: CheckResult[] = [];
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const r = await fetch("/api/bookmarks/broken-check", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: batch }),
        });
        const data = await r.json();
        allResults.push(...data);
        setProgress(Math.min(i + batchSize, ids.length));
      }

      setResults(allResults.filter(r => !r.ok));
      setChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const deleteBookmark = async (id: number) => {
    setDeleting(id);
    try {
      const token = getAuthToken();
      await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(prev => prev.filter(r => r.id !== id));
      onDeleted?.();
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return "text-red-400";
    if (status >= 400 && status < 500) return "text-orange-400";
    if (status >= 500) return "text-red-400";
    return "text-red-400";
  };

  const getStatusLabel = (status: number) => {
    if (status === 0) return "Unreachable";
    if (status === 404) return "Not Found";
    if (status === 403) return "Forbidden";
    if (status === 410) return "Gone";
    if (status >= 500) return "Server Error";
    return `Error ${status}`;
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setChecked(false); setResults([]); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-xl bg-[#0f0f1c] border border-white/[0.09] rounded-2xl p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/[0.07] shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold">
            <LinkIcon className="size-4 text-red-400" />
            Broken Links Checker
          </DialogTitle>
          <p className="text-[12px] text-white/40 mt-0.5">Find dead links in your bookmark library</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {!checked && !loading ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <LinkIcon className="size-7 text-red-400/60" />
              </div>
              <p className="text-[14px] font-semibold text-white/50 mb-2">Check for broken links</p>
              <p className="text-[12px] text-white/25 mb-2">We'll ping each bookmark URL to check if it's still alive.</p>
              <p className="text-[11px] text-white/20 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                ⚠️ This may take a while for large libraries. Please wait.
              </p>
              <button
                onClick={runCheck}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600/70 hover:bg-red-500/70 text-white text-[13px] font-semibold transition-colors"
              >
                <LinkIcon className="size-4" /> Check all links
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="size-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-[14px] font-semibold text-white/60 mb-2">Checking links…</p>
              <p className="text-[12px] text-white/30">{progress} / {total} checked</p>
              <div className="mt-4 w-48 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: total ? `${(progress / total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="size-7 text-emerald-400" />
              </div>
              <p className="text-[15px] font-bold text-emerald-400 mb-1">All links are working!</p>
              <p className="text-[12px] text-white/30">Checked {total} bookmarks, no broken links found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-orange-400" />
                <p className="text-[13px] text-white/60">
                  Found <span className="text-red-400 font-bold">{results.length}</span> broken link{results.length !== 1 ? "s" : ""} out of {total} checked
                </p>
              </div>
              {results.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <XCircle className={`size-4 shrink-0 ${getStatusColor(r.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-white/70 truncate">{r.title}</p>
                    <p className="text-[10px] text-white/30 truncate mt-0.5">{r.url}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 shrink-0 ${getStatusColor(r.status)}`}>
                    {getStatusLabel(r.status)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md text-white/20 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                    <button
                      onClick={() => deleteBookmark(r.id)}
                      disabled={deleting === r.id}
                      className="p-1.5 rounded-md text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors disabled:opacity-50"
                    >
                      {deleting === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
