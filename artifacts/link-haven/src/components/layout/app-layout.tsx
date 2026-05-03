import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppSidebar } from "../app-sidebar";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { getAuthToken } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UltraAiChat } from "@/features/ultra-ai-chat";
import { useListBookmarks, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { useBg } from "@/lib/background";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, MessageSquare } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const token = getAuthToken();
  const [geminiOpen, setGeminiOpen] = useState(false);
  const { bgPath } = useBg();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
  });

  const { data: allBookmarks = [] } = useListBookmarks({} as any, {
    query: { queryKey: getListBookmarksQueryKey() },
  });

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

  const userLetter = user.name
    ? user.name.split(" ").map((w: string) => w[0]).filter(Boolean).join("").substring(0, 1).toUpperCase()
    : "U";

  return (
    <>
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
          <div style={{ position: "absolute", inset: 0, background: "rgba(4,4,11,.46)" }} />
        </div>
      )}

      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full text-foreground" style={{ background: "transparent", position: "relative", zIndex: 1 }}>
          <AppSidebar user={user} bgActive={!!bgPath} />
          <SidebarInset
            className="flex-1 overflow-hidden"
            style={{ background: "transparent" }}
          >
            <main className="flex flex-col h-[100dvh] overflow-hidden" style={{ background: "transparent" }}>
              {children}
            </main>
          </SidebarInset>
        </div>

        {/* Floating chatbot FAB */}
        <ChatFab open={geminiOpen} onClick={() => setGeminiOpen(v => !v)} />

        <AnimatePresence>
          {geminiOpen && (
            <UltraAiChat
              onClose={() => setGeminiOpen(false)}
              userLetter={userLetter}
              onRefresh={() => {
                queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
              }}
            />
          )}
        </AnimatePresence>
      </SidebarProvider>
    </>
  );
}

/* ─── Floating chatbot button ────────────────────────────────── */
const FAB_CSS = `
@keyframes _fab-orb { 0%,100%{transform:translate(0,0)scale(1);opacity:.6} 50%{transform:translate(-8px,-10px)scale(1.3);opacity:.9} }
@keyframes _fab-orb2 { 0%,100%{transform:translate(0,0)scale(1);opacity:.5} 60%{transform:translate(10px,-6px)scale(1.2);opacity:.8} }
@keyframes _fab-orb3 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(-6px,8px)scale(1.15)} }
@keyframes _fab-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes _fab-ping { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
@keyframes _fab-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes _fab-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes _fab-dot-1 { 0%,80%,100%{transform:scale(0);opacity:0} 40%{transform:scale(1);opacity:1} }
@keyframes _fab-dot-2 { 0%,20%,100%{transform:scale(0);opacity:0} 60%{transform:scale(1);opacity:1} }
@keyframes _fab-dot-3 { 0%,40%,100%{transform:scale(0);opacity:0} 80%{transform:scale(1);opacity:1} }
`;

function ChatFab({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <>
      <style>{FAB_CSS}</style>
      <motion.button
        onClick={onClick}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.4 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 50,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          padding: 0,
          outline: "none",
        }}
        title={open ? "Close AI Assistant (⌘J)" : "Open AI Assistant (⌘J)"}
      >
        {/* Glow ring */}
        <span style={{
          position: "absolute", inset: -2, borderRadius: "50%",
          background: "conic-gradient(from 0deg, #6366f1, #8b5cf6, #06b6d4, #ec4899, #6366f1)",
          animation: "_fab-spin 4s linear infinite",
          opacity: open ? 0.9 : 0.6,
        }}/>
        {/* Inner fill */}
        <span style={{
          position: "absolute", inset: 1.5, borderRadius: "50%",
          background: "linear-gradient(145deg, #1e1b4b, #0f0f1e)",
        }}/>

        {/* Orbs */}
        <span style={{ position:"absolute", inset:0, borderRadius:"50%", overflow:"hidden", pointerEvents:"none" }}>
          <span style={{ position:"absolute", width:20, height:20, borderRadius:"50%", top:"15%", left:"18%", backgroundColor:"#6366f1", filter:"blur(6px)", animation:"_fab-orb 3s ease-in-out infinite", opacity:.7 }}/>
          <span style={{ position:"absolute", width:16, height:16, borderRadius:"50%", bottom:"18%", right:"16%", backgroundColor:"#8b5cf6", filter:"blur(5px)", animation:"_fab-orb2 2.4s ease-in-out infinite", opacity:.6 }}/>
          <span style={{ position:"absolute", width:12, height:12, borderRadius:"50%", top:"50%", right:"20%", backgroundColor:"#06b6d4", filter:"blur(4px)", animation:"_fab-orb3 2.8s ease-in-out infinite", opacity:.5 }}/>
        </span>

        {/* Icon */}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}
            >
              <X size={22} color="rgba(255,255,255,.9)" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1, y: [0, -2, 0] }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}
            >
              <Sparkles size={22} color="rgba(255,255,255,.92)" strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!open && (
          <span style={{
            position:"absolute", inset:-4, borderRadius:"50%",
            border:"1.5px solid rgba(99,102,241,.5)",
            animation:"_fab-ping 2.5s ease-out infinite",
            pointerEvents:"none",
          }}/>
        )}

        {/* Tooltip badge */}
        <motion.span
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          style={{
            position:"absolute", right:"calc(100% + 10px)", top:"50%", transform:"translateY(-50%)",
            background:"rgba(8,8,20,.92)", border:"1px solid rgba(99,102,241,.3)",
            borderRadius:10, padding:"5px 10px", whiteSpace:"nowrap",
            fontSize:11, fontWeight:700, color:"rgba(255,255,255,.7)",
            pointerEvents:"none", backdropFilter:"blur(16px)",
            boxShadow:"0 4px 16px rgba(0,0,0,.4)",
            display: open ? "none" : "block",
          }}
        >
          Haven AI
          <span style={{ marginLeft:6, fontSize:9, color:"rgba(99,102,241,.8)", fontWeight:600 }}>⌘J</span>
        </motion.span>
      </motion.button>
    </>
  );
}
