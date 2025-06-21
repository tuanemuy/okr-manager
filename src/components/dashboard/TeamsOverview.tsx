import { Users } from "lucide-react";
import Link from "next/link";
import { getDashboardDataAction } from "@/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeamsOverview() {
  const dashboardResult = await getDashboardDataAction();
  const dashboardData = dashboardResult.success ? dashboardResult.data : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>所属チーム</CardTitle>
        </div>
        <CardDescription>参加しているチームの一覧</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">チーム数</span>
            <Badge variant="secondary">
              {dashboardData?.teams?.length || 0}
            </Badge>
          </div>
          {dashboardData?.teams && dashboardData.teams.length > 0 && (
            <div className="space-y-2">
              {dashboardData.teams.slice(0, 3).map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{team.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {team.memberCount}人
                  </Badge>
                </div>
              ))}
              {dashboardData.teams && dashboardData.teams.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  他 {dashboardData.teams.length - 3} チーム
                </div>
              )}
            </div>
          )}
          <Link href="/teams">
            <Button variant="outline" className="w-full">
              チーム一覧を見る
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
