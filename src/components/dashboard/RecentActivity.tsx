import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { getDashboardDataAction } from "@/actions/dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function RecentActivity() {
  const dashboardResult = await getDashboardDataAction();
  const dashboardData = dashboardResult.success ? dashboardResult.data : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>最近のアクティビティ</CardTitle>
        </div>
        <CardDescription>直近の更新とレビュー</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardData?.recentActivity &&
          dashboardData.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {dashboardData.recentActivity.slice(0, 3).map((activity) => (
                <div
                  key={activity.id}
                  className="border-l-2 border-primary/20 pl-3"
                >
                  <div className="text-sm">{activity.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {activity.createdAt.toLocaleDateString("ja-JP")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              まだアクティビティがありません
            </div>
          )}
          <Link href="/notifications">
            <Button variant="outline" className="w-full">
              通知を見る
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
