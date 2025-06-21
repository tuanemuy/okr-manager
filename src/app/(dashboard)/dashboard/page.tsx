import {
  AlertTriangle,
  CalendarClock,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
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

export default async function DashboardPage() {
  const dashboardResult = await getDashboardDataAction();

  const dashboardData = dashboardResult.success ? dashboardResult.data : null;
  return (
    <div className="container mx-auto py-8">
      {/* Alert for overdue OKRs */}
      {dashboardData?.okrStats &&
        (dashboardData.okrStats.overdue > 0 ||
          dashboardData.okrStats.dueThisWeek > 0) && (
          <div className="mb-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-orange-800">
                    注意が必要なOKR
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.okrStats.overdue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700">
                        期限切れのOKR
                      </span>
                      <Badge
                        variant="destructive"
                        className="bg-red-600 text-white"
                      >
                        {dashboardData.okrStats.overdue}件
                      </Badge>
                    </div>
                  )}
                  {dashboardData.okrStats.dueThisWeek > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700">
                        今週期限のOKR
                      </span>
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
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Teams Overview */}
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

        {/* Current OKRs */}
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

        {/* Recent Activity */}
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
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-gray-900">
            クイックアクション
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/teams" className="block">
            <Button className="h-20 flex flex-col space-y-1 w-full">
              <span className="text-sm font-medium">新しいチーム</span>
              <span className="text-xs opacity-75">チームを作成</span>
            </Button>
          </Link>
          {dashboardData?.teams && dashboardData.teams.length > 0 && (
            <Link
              href={`/teams/${dashboardData.teams[0].id}/okrs/new`}
              className="block"
            >
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-1 w-full"
              >
                <span className="text-sm font-medium">OKR作成</span>
                <span className="text-xs opacity-75">新しい目標を設定</span>
              </Button>
            </Link>
          )}
          <Link href="/search?type=okr" className="block">
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-1 w-full"
            >
              <span className="text-sm font-medium">OKR検索</span>
              <span className="text-xs opacity-75">OKRを検索・閲覧</span>
            </Button>
          </Link>
          <Link href="/invitations" className="block">
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-1 w-full"
            >
              <span className="text-sm font-medium">招待確認</span>
              <span className="text-xs opacity-75">チーム招待を確認</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
