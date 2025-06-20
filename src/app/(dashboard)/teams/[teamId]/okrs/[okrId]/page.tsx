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
import { notFound } from "next/navigation";
import { getOkrAction } from "@/actions/okr";
import { ProgressUpdateDialog } from "@/components/okr/ProgressUpdateDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default async function OkrDetailPage({
  params,
}: {
  params: { teamId: string; okrId: string };
}) {
  const okrData = await getOkrAction(params.okrId);

  if (!okrData.okr) {
    notFound();
  }

  const { okr, keyResults } = okrData;

  // Calculate overall progress from key results
  const overallProgress =
    keyResults.length > 0
      ? (keyResults.reduce(
          (sum, kr) => sum + kr.currentValue / kr.targetValue,
          0,
        ) /
          keyResults.length) *
        100
      : 0;

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
              {keyResults.map((kr, index) => {
                const progress =
                  kr.targetValue > 0
                    ? (kr.currentValue / kr.targetValue) * 100
                    : 0;

                return (
                  <div key={kr.id}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{kr.title}</h4>
                      </div>
                      <Badge
                        variant="outline"
                        className={getProgressColor(progress)}
                      >
                        {Math.round(progress)}%
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>
                        現在値: {kr.currentValue}
                        {kr.unit && ` ${kr.unit}`} / 目標: {kr.targetValue}
                        {kr.unit && ` ${kr.unit}`}
                      </span>
                      <ProgressUpdateDialog keyResult={kr} />
                    </div>

                    <Progress value={Math.min(progress, 100)} className="h-2" />

                    {index < keyResults.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                );
              })}
              {keyResults.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Key Resultがありません
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                レビュー
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews`}
                  >
                    すべて見る
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  レビュー機能は近日実装予定です
                </p>
                <Button size="sm" className="mt-2" asChild>
                  <Link
                    href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/new`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    レビューを作成
                  </Link>
                </Button>
              </div>
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
                <span className="text-sm">
                  所有者: {okr.owner?.displayName || "チーム"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  期間: Q{okr.quarterQuarter} {okr.quarterYear}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  種類: {okr.type === "team" ? "チーム" : "個人"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  作成日: {okr.createdAt.toLocaleDateString("ja-JP")}
                </span>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">全体進捗</span>
                  <span
                    className={`text-sm font-bold ${getProgressColor(overallProgress)}`}
                  >
                    {Math.round(overallProgress)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(overallProgress, 100)}
                  className="h-3"
                />
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
