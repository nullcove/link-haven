import { ReactNode } from "react";
import { useLocation } from "wouter";
import { AppSidebar } from "../app-sidebar";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { getAuthToken } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const token = getAuthToken();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey()
    }
  });

  if (!token) {
    setLocation("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-primary">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="text-sm font-medium tracking-widest uppercase">LOADING HAVEN</div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    setLocation("/login");
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/30">
        <AppSidebar user={user} />
        <SidebarInset className="flex-1 overflow-hidden bg-background">
          <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
