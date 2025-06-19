import { logoutAction } from "@/actions/auth";
import { getTeamsAction } from "@/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const teams = await getTeamsAction();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              OKR管理システム
            </h1>
            <div className="flex items-center space-x-4">
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  プロフィール
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button variant="outline" size="sm" type="submit">
                  ログアウト
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Teams Overview */}
          <Card>
            <CardHeader>
              <CardTitle>所属チーム</CardTitle>
              <CardDescription>参加しているチームの一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">チーム数</span>
                  <Badge variant="secondary">{teams.length}</Badge>
                </div>
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
              <CardTitle>進行中のOKR</CardTitle>
              <CardDescription>現在期のOKR進捗</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">個人OKR</span>
                  <Badge variant="secondary">1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">チームOKR</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  OKR一覧を見る
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>最近のアクティビティ</CardTitle>
              <CardDescription>直近の更新とレビュー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  まだアクティビティがありません
                </div>
                <Button variant="outline" className="w-full">
                  通知を見る
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/teams" className="block">
              <Button className="h-20 flex flex-col space-y-1 w-full">
                <span className="text-sm font-medium">新しいチーム</span>
                <span className="text-xs opacity-75">チームを作成</span>
              </Button>
            </Link>
            <Link href="/teams" className="block">
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-1 w-full"
              >
                <span className="text-sm font-medium">個人OKR作成</span>
                <span className="text-xs opacity-75">新しい目標を設定</span>
              </Button>
            </Link>
            <Link href="/teams" className="block">
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-1 w-full"
              >
                <span className="text-sm font-medium">進捗更新</span>
                <span className="text-xs opacity-75">KeyResultを更新</span>
              </Button>
            </Link>
            <Link href="/teams" className="block">
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-1 w-full"
              >
                <span className="text-sm font-medium">レビュー作成</span>
                <span className="text-xs opacity-75">進捗をレビュー</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
