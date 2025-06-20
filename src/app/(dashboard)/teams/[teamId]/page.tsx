import { Settings, Target, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOkrsAction } from "@/actions/okr";
import { getTeamAction, getTeamMembersAction } from "@/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  // Fetch team data and related information
  const [teamResult, teamMembersResult, okrsResult] = await Promise.all([
    getTeamAction(teamId),
    getTeamMembersAction(teamId),
    getOkrsAction(teamId),
  ]);

  if (!teamResult.success) {
    notFound();
  }

  if (!teamResult.data) {
    return <div>Team not found</div>;
  }

  const team = teamResult.data;
  const teamMembers = teamMembersResult.success
    ? teamMembersResult.data
    : { items: [], totalCount: 0 };
  const okrs = Array.isArray(okrsResult) ? okrsResult : [];

  const memberCount = teamMembers?.items?.length || 0;
  const okrCount = okrs.length;
  const adminCount =
    teamMembers?.items?.filter((member) => member.role === "admin").length || 0;

  const stats = [
    {
      title: "メンバー数",
      value: memberCount,
      icon: Users,
    },
    {
      title: "OKR数",
      value: okrCount,
      icon: Target,
    },
    {
      title: "管理者数",
      value: adminCount,
      icon: Settings,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground mt-2">{team.description}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/teams/${team.id}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/teams/${team.id}/okrs`}>
                <Target className="h-4 w-4 mr-2" />
                OKR管理
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              メンバー
              <Button size="sm" asChild>
                <Link href={`/teams/${team.id}/members`}>メンバー管理</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers?.items?.slice(0, 3).map((member) => {
                const initials = member.user.displayName
                  .split(" ")
                  .map((name: string) => name[0])
                  .join("")
                  .toUpperCase();
                const roleDisplayMap: Record<string, string> = {
                  admin: "管理者",
                  member: "メンバー",
                  viewer: "閲覧者",
                };

                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium">{member.user.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        member.role === "admin" ? "outline" : "secondary"
                      }
                    >
                      {roleDisplayMap[member.role] || member.role}
                    </Badge>
                  </div>
                );
              })}
              {(teamMembers?.items?.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  メンバーがいません
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              最近のOKR
              <Button size="sm" asChild>
                <Link href={`/teams/${team.id}/okrs`}>すべて見る</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {okrs.slice(0, 3).map((okr) => {
                // Calculate progress from key results
                const totalKeyResults = okr.keyResults?.length || 0;
                const progress =
                  totalKeyResults > 0
                    ? (okr.keyResults.reduce(
                        (sum: number, kr) =>
                          sum + kr.currentValue / kr.targetValue,
                        0,
                      ) /
                        totalKeyResults) *
                      100
                    : 0;

                return (
                  <div key={okr.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium">{okr.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {okr.description || "説明なし"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline">
                        Q{okr.quarterQuarter} {okr.quarterYear}
                      </Badge>
                      <span className="text-sm font-medium">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {okrs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  OKRがありません
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
