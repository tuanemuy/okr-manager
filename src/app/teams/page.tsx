import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                ← ダッシュボード
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                チーム一覧
              </h1>
            </div>
            <Button>新しいチーム作成</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample Team Cards */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>開発チーム</CardTitle>
                  <CardDescription>プロダクト開発を担当</CardDescription>
                </div>
                <Badge variant="secondary">管理者</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">メンバー数</span>
                  <span className="font-medium">5人</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">進行中のOKR</span>
                  <span className="font-medium">3個</span>
                </div>
                <Link href="/teams/team-1">
                  <Button variant="outline" className="w-full">
                    チーム詳細
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>マーケティングチーム</CardTitle>
                  <CardDescription>マーケティング施策を担当</CardDescription>
                </div>
                <Badge variant="outline">メンバー</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">メンバー数</span>
                  <span className="font-medium">3人</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">進行中のOKR</span>
                  <span className="font-medium">2個</span>
                </div>
                <Link href="/teams/team-2">
                  <Button variant="outline" className="w-full">
                    チーム詳細
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Create Team Card */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  新しいチームを作成
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  チームを作成してOKRの管理を始めましょう
                </p>
                <Button>チーム作成</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invitations Section */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">招待</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-600">
                現在、保留中の招待はありません
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
