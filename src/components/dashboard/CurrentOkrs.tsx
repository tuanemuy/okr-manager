import { Target } from "lucide-react";
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

export default async function CurrentOkrs() {
  const dashboardResult = await getDashboardDataAction();
  const dashboardData = dashboardResult.success ? dashboardResult.data : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>進行中のOKR</CardTitle>
        </div>
        <CardDescription>現在期のOKR進捗</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">個人OKR</span>
            <Badge variant="secondary">
              {dashboardData?.okrStats?.personalOkrs || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">チームOKR</span>
            <Badge variant="secondary">
              {dashboardData?.okrStats?.teamOkrs || 0}
            </Badge>
          </div>
          {dashboardData?.okrStats &&
            dashboardData.okrStats.totalProgress > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">平均進捗</span>
                <Badge
                  variant={
                    dashboardData.okrStats.totalProgress >= 80
                      ? "default"
                      : dashboardData.okrStats.totalProgress >= 50
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {dashboardData.okrStats.totalProgress}%
                </Badge>
              </div>
            )}
          <Link href="/search?type=okr">
            <Button variant="outline" className="w-full">
              OKR一覧を見る
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
