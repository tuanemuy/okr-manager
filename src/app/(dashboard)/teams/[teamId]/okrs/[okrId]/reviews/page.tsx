import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MessageSquare, Star, Calendar } from "lucide-react";

export default function OkrReviewsPage({
  params,
}: {
  params: { teamId: string; okrId: string };
}) {
  // TODO: Fetch reviews using server actions
  const reviews = [
    {
      id: "1",
      date: "2024-03-01",
      author: "John Doe",
      content: "順調に進捗しています。新機能のリリースが予定通り進んでいます。テストカバレッジも目標に近づいており、品質面でも良好です。",
      score: 4,
      type: "regular",
    },
    {
      id: "2",
      date: "2024-02-15",
      author: "Jane Smith",
      content: "テストカバレッジの向上が素晴らしいです。品質が確実に向上しており、バグ数も順調に減少しています。",
      score: 5,
      type: "regular",
    },
    {
      id: "3",
      date: "2024-02-01",
      author: "Mike Johnson",
      content: "最初の新機能をリリースしました。ユーザーからの反応も良好で、品質も期待通りです。",
      score: 4,
      type: "regular",
    },
    {
      id: "4",
      date: "2024-01-15",
      author: "John Doe",
      content: "プロジェクトを開始しました。チーム全体でコミットし、目標達成に向けて頑張ります。",
      score: 3,
      type: "initial",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "initial":
        return <Badge variant="outline">初期</Badge>;
      case "final":
        return <Badge variant="default">最終</Badge>;
      default:
        return <Badge variant="secondary">定期</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">レビュー一覧</h1>
            <p className="text-muted-foreground mt-2">
              OKRの進捗レビューと評価
            </p>
          </div>
          <Button asChild>
            <Link href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/new`}>
              <Plus className="h-4 w-4 mr-2" />
              新しいレビュー
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="レビューを検索..."
              className="md:max-w-sm"
            />
            <Select defaultValue="all">
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="initial">初期レビュー</SelectItem>
                <SelectItem value="regular">定期レビュー</SelectItem>
                <SelectItem value="final">最終レビュー</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="評価で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての評価</SelectItem>
                <SelectItem value="5">5点</SelectItem>
                <SelectItem value="4">4点</SelectItem>
                <SelectItem value="3">3点</SelectItem>
                <SelectItem value="2">2点</SelectItem>
                <SelectItem value="1">1点</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="font-medium">{review.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(review.date).toLocaleDateString('ja-JP')}
                  </div>
                  {getTypeBadge(review.type)}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={`review-${review.id}-star-${i}`}
                        className={`h-4 w-4 ${
                          i < review.score
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <Badge className={getScoreColor(review.score)}>
                    {review.score}/5
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{review.content}</p>
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/${review.id}`}>
                    詳細を見る
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">レビューがありません</h3>
            <p className="text-muted-foreground mb-4">
              最初のレビューを作成してOKRの進捗を記録しましょう
            </p>
            <Button asChild>
              <Link href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/new`}>
                <Plus className="h-4 w-4 mr-2" />
                新しいレビュー
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            前へ
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            1 / 1 ページ
          </span>
          <Button variant="outline" size="sm" disabled>
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}