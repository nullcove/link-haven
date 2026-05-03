import { AppLayout } from "@/components/layout/app-layout";
import { useListBookmarks, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { AnalyticsDashboard } from "@/features/analytics-dashboard";
import { TagCloud } from "@/features/tag-cloud";
import { RecentActivity } from "@/features/recent-activity";
import { useLocation } from "wouter";
import { ClayBarIcon } from "@/components/ui/clay-icon";

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { data: bookmarks = [] } = useListBookmarks({} as any, {
    query: { queryKey: getListBookmarksQueryKey() },
  });

  return (
    <AppLayout>
      <header className="h-14 shrink-0 border-b border-white/[0.06] flex items-center gap-3 px-5 sticky top-0 z-10"
        style={{ background: "rgba(6,6,12,.9)", backdropFilter: "blur(24px)" }}>
        <ClayBarIcon color="#0891b2" light="#67e8f9" size={36} />
        <div>
          <h1 className="font-black text-[15px] text-white leading-none">Analytics</h1>
          <p className="text-[10.5px] mt-[2px]" style={{ color: "rgba(255,255,255,.28)" }}>
            {(bookmarks as any[]).length} bookmarks total
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnalyticsDashboard bookmarks={bookmarks as any} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <TagCloud
              bookmarks={bookmarks as any}
              onTagClick={tag => setLocation(`/app?tag=${tag}`)}
            />
          </div>
          <div>
            <RecentActivity
              bookmarks={bookmarks as any}
              onSelect={() => setLocation("/app")}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
