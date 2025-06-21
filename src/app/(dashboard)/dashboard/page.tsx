import { Suspense } from "react";
import AlertSection from "@/components/dashboard/AlertSection";
import CurrentOkrs from "@/components/dashboard/CurrentOkrs";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import TeamsOverview from "@/components/dashboard/TeamsOverview";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<Skeleton className="h-32 w-full mb-6" />}>
        <AlertSection />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Suspense fallback={<DashboardCardSkeleton />}>
          <TeamsOverview />
        </Suspense>

        <Suspense fallback={<DashboardCardSkeleton />}>
          <CurrentOkrs />
        </Suspense>

        <Suspense fallback={<DashboardCardSkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-48 w-full mt-8" />}>
        <QuickActions />
      </Suspense>
    </div>
  );
}
