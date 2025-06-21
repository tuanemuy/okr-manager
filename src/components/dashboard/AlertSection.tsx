import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getDashboardDataAction } from "@/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AlertSection() {
  const dashboardResult = await getDashboardDataAction();
  const dashboardData = dashboardResult.success ? dashboardResult.data : null;

  if (
    !dashboardData?.okrStats ||
    (dashboardData.okrStats.overdue === 0 &&
      dashboardData.okrStats.dueThisWeek === 0)
  ) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">注意が必要なOKR</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboardData.okrStats.overdue > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">期限切れのOKR</span>
                <Badge variant="destructive" className="bg-red-600 text-white">
                  {dashboardData.okrStats.overdue}件
                </Badge>
              </div>
            )}
            {dashboardData.okrStats.dueThisWeek > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">今週期限のOKR</span>
                <Badge
                  variant="outline"
                  className="border-orange-300 text-orange-700"
                >
                  {dashboardData.okrStats.dueThisWeek}件
                </Badge>
              </div>
            )}
            <Link href="/search?type=okr&quarter=overdue">
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                期限切れOKRを確認
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
