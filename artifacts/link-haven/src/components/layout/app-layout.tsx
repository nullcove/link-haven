import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppSidebar } from "../app-sidebar";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { getAuthToken } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { GeminiChat } from "@/features/gemini-chat";
import { useListBookmarks, getListBookmarksQueryKey } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const token = getAuthToken();
  const [geminiOpen, setGeminiOpen] = useState(false);

  const { data: user, isLoading, isError } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
  });

  const { data: allBookmarks = [] } = useListBookmarks({} as any, {
    query: { queryKey: getListBookmarksQueryKey() },
  });

  useEffect(() => {
    if (!token) setLocation("/login");
  }, [token, setLocation]);

  useEffect(() => {
    if (!isLoading && (isError || (!user && token))) setLocation("/login");
  }, [isLoading, isError, user, token, setLocation]);

  // ⌘J / Ctrl+J to toggle Gemini
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#080810] text-foreground">
        <AppSidebar user={user} onOpenGemini={() => setGeminiOpen(v => !v)} />
        <SidebarInset className="flex-1 overflow-hidden">
          <main className="flex flex-col h-[100dvh] overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
      {geminiOpen && (
        <GeminiChat onClose={() => setGeminiOpen(false)} bookmarks={allBookmarks as any} />
      )}
    </SidebarProvider>
  );
}
