import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppSidebar } from "../app-sidebar";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { getAuthToken } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { GeminiChat } from "@/features/gemini-chat";
import { useListBookmarks, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { useBg } from "@/lib/background";

export function AppLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const token = getAuthToken();
  const [geminiOpen, setGeminiOpen] = useState(false);
  const { bgPath } = useBg();

  const { data: user, isLoading, isError } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
  });

  const { data: allBookmarks = [] } = useListBookmarks({} as any, {
    query: { queryKey: getListBookmarksQueryKey() },
  });

  /* ── Background on body ─────────────────────────────────────────
     We set backgroundColor=transparent when bgPath is active so
     the fixed-position bg layer beneath shows through. When no bg,
     remove the inline style and let the Tailwind bg-background class
     (dark solid) take over again automatically.
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (bgPath) {
      document.body.style.backgroundColor = "transparent";
    } else {
      document.body.style.backgroundColor = "";
    }
    return () => { document.body.style.backgroundColor = ""; };
  }, [bgPath]);

  useEffect(() => {
    if (!token) setLocation("/login");
  }, [token, setLocation]);

  useEffect(() => {
    if (!isLoading && (isError || (!user && token))) setLocation("/login");
  }, [isLoading, isError, user, token, setLocation]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") { e.preventDefault(); setGeminiOpen(v => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#080810]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative size-12">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
          </div>
          <div className="text-xs font-mono tracking-[0.3em] text-indigo-400/60 uppercase">Loading Haven</div>
        </div>
      </div>
    );
  }

  if (isError || !user) return null;

  return (
    <>
      {/* ── Fixed background layer — fades in/out with CSS keyframe ── */}
      <style>{`
        @keyframes _bg-fade { from { opacity: 0 } to { opacity: 1 } }
        ._bg-layer { animation: _bg-fade .7s ease both; }
      `}</style>

      {bgPath && (
        <div
          key={bgPath}
          className="_bg-layer"
          style={{
            position: "fixed", inset: 0, zIndex: 0,
            backgroundImage: `url(${bgPath})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* dark tint overlay for readability */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(4,4,11,.46)" }} />
        </div>
      )}

      <SidebarProvider defaultOpen={true}>
        {/* z-index:1 so content sits above the fixed bg layer */}
        <div className="flex min-h-screen w-full text-foreground" style={{ background: "transparent", position: "relative", zIndex: 1 }}>
          <AppSidebar user={user} onOpenGemini={() => setGeminiOpen(v => !v)} bgActive={!!bgPath} />
          <SidebarInset
            className="flex-1 overflow-hidden"
            style={{ background: "transparent" }}
          >
            <main className="flex flex-col h-[100dvh] overflow-hidden" style={{ background: "transparent" }}>
              {children}
            </main>
          </SidebarInset>
        </div>
        {geminiOpen && (
          <GeminiChat onClose={() => setGeminiOpen(false)} bookmarks={allBookmarks as any} />
        )}
      </SidebarProvider>
    </>
  );
}
