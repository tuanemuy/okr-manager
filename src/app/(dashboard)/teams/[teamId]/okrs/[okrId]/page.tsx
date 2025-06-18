import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Edit,
  MessageSquare,
  Plus,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";

export default function OkrDetailPage({
  params,
}: {
  params: { teamId: string; okrId: string };
}) {
  // TODO: Fetch OKR data using server actions
  const okr = {
    id: params.okrId,
    title: "Q1 プロダクト開発",
    description:
      "新機能のリリースと品質向上を通じて、ユーザー満足度を向上させる",
    type: "team",
    owner: "Engineering Team",
    period: "2024 Q1",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    progress: 75,
    status: "active",
    createdAt: "2024-01-01",
  };

  const keyResults = [
    {
      id: "1",
      title: "新機能を3つリリースする",
      description: "ユーザーからの要望が多い機能を優先的に実装",
      targetValue: 3,
      currentValue: 2,
      unit: "個",
      progress: 67,
    },
    {
      id: "2",
      title: "バグ数を50%削減する",
      description: "品質向上のためのテスト強化とコードレビュー",
      targetValue: 50,
      currentValue: 35,
      unit: "%",
      progress: 70,
    },
    {
      id: "3",
      title: "テストカバレッジを90%以上にする",
      description: "自動テストの拡充とテスト品質の向上",
      targetValue: 90,
      currentValue: 85,
      unit: "%",
      progress: 94,
    },
  ];

  const recentReviews = [
    {
      id: "1",
      date: "2024-03-01",
      author: "John Doe",
      content: "順調に進捗しています。新機能のリリースが予定通り進んでいます。",
      score: 4,
    },
    {
      id: "2",
      date: "2024-02-15",
      author: "Jane Smith",
      content:
        "テストカバレッジの向上が素晴らしいです。品質が確実に向上しています。",
      score: 5,
    },
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">{okr.title}</h1>
            </div>
            <p className="text-muted-foreground">{okr.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/teams/${params.teamId}/okrs/${params.okrId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/new`}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                レビュー作成
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {keyResults.map((kr, index) => (
                <div key={kr.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{kr.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {kr.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getProgressColor(kr.progress)}
                    >
                      {kr.progress}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>
                      現在値: {kr.currentValue}
                      {kr.unit} / 目標: {kr.targetValue}
                      {kr.unit}
                    </span>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-3 w-3 mr-1" />
                      更新
                    </Button>
                  </div>

                  <Progress value={kr.progress} className="h-2" />

                  {index < keyResults.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                最近のレビュー
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews`}
                  >
                    すべて見る
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.author}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <Badge variant="outline">{review.score}/5</Badge>
                  </div>
                  <p className="text-sm">{review.content}</p>
                </div>
              ))}

              {recentReviews.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    まだレビューがありません
                  </p>
                  <Button size="sm" className="mt-2" asChild>
                    <Link
                      href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/new`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      最初のレビューを作成
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OKR情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">所有者: {okr.owner}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  期間: {new Date(okr.startDate).toLocaleDateString("ja-JP")} -{" "}
                  {new Date(okr.endDate).toLocaleDateString("ja-JP")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  作成日: {new Date(okr.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">全体進捗</span>
                  <span
                    className={`text-sm font-bold ${getProgressColor(okr.progress)}`}
                  >
                    {okr.progress}%
                  </span>
                </div>
                <Progress value={okr.progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <Link
                  href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/new`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  レビューを作成
                </Link>
              </Button>

              <Button className="w-full" variant="outline" asChild>
                <Link
                  href={`/teams/${params.teamId}/okrs/${params.okrId}/edit`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  OKRを編集
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
