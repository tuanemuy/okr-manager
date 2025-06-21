import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTeamAction } from "@/actions/team";
import TeamMembers from "@/components/team/TeamMembers";
import TeamRecentOkrs from "@/components/team/TeamRecentOkrs";
import TeamStats from "@/components/team/TeamStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TeamStatsSkeleton() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function TeamCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 border rounded-lg">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="p-3 border rounded-lg">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="p-3 border rounded-lg">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function TeamDetailContent({ teamId }: { teamId: string }) {
  const teamResult = await getTeamAction(teamId);

  if (!teamResult.success) {
    notFound();
  }

  if (!teamResult.data) {
    return <div>Team not found</div>;
  }

  const team = teamResult.data;

  return (
    <>
      <Suspense fallback={<TeamStatsSkeleton />}>
        <TeamStats
          teamId={team.id}
          teamName={team.name}
          teamDescription={team.description}
        />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<TeamCardSkeleton />}>
          <TeamMembers teamId={team.id} />
        </Suspense>

        <Suspense fallback={<TeamCardSkeleton />}>
          <TeamRecentOkrs teamId={team.id} />
        </Suspense>
      </div>
    </>
  );
}

function TeamDetailSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <TeamStatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TeamCardSkeleton />
        <TeamCardSkeleton />
      </div>
    </div>
  );
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<TeamDetailSkeleton />}>
        <TeamDetailContent teamId={teamId} />
      </Suspense>
    </div>
  );
}
