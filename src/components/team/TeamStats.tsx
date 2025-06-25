import { Settings, Target, Users } from "lucide-react";
import Link from "next/link";
import { getOkrsAction } from "@/actions/okr";
import { getTeamMembersAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamStatsProps {
  teamId: string;
  teamName: string;
  teamDescription?: string;
}

export default async function TeamStats({
  teamId,
  teamName,
  teamDescription,
}: TeamStatsProps) {
  const [teamMembersResult, okrsResult] = await Promise.all([
    getTeamMembersAction(teamId),
    getOkrsAction(teamId),
  ]);

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
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{teamName}</h1>
            <p className="text-muted-foreground mt-2">{teamDescription}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/teams/${teamId}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/teams/${teamId}/okrs`}>
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
    </>
  );
}
