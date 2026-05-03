import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";

const VerifyEmailPage = lazy(() => import("@/pages/verify-email"));
const AppPage         = lazy(() => import("@/pages/app/index"));
const CollectionPage  = lazy(() => import("@/pages/app/collection"));
const SettingsPage    = lazy(() => import("@/pages/settings"));
const AISettingsPage  = lazy(() => import("@/pages/ai-settings"));
const AnalyticsPage   = lazy(() => import("@/pages/analytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { document.documentElement.classList.add("dark"); }, []);
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
      <div className="size-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
    </div>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={LoginPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route path="/app" component={AppPage} />
        <Route path="/app/collection/:id" component={CollectionPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/ai-settings" component={AISettingsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
