import { AppLayout } from "@/components/layout/app-layout";
import { useListBookmarks, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { AnalyticsDashboard } from "@/features/analytics-dashboard";
import { TagCloud } from "@/features/tag-cloud";
import { RecentActivity } from "@/features/recent-activity";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { data: bookmarks = [] } = useListBookmarks({} as any, {
    query: { queryKey: getListBookmarksQueryKey() },
  });

  return (
    <AppLayout>
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-6 bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-indigo-400" />
          <h1 className="font-semibold text-[15px]">Analytics</h1>
        </div>
        <span className="ml-3 text-[12px] text-white/25">{bookmarks.length} bookmarks</span>
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
