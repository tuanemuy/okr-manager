import { Calendar, MessageSquare, Plus, Star } from "lucide-react";
import Link from "next/link";
import { getOkrReviewsAction } from "@/actions/okr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function OkrReviewsPage({
  params,
}: {
  params: { teamId: string; okrId: string };
}) {
  const reviews = await getOkrReviewsAction(params.okrId);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "progress":
        return <Badge variant="secondary">進捗</Badge>;
      case "final":
        return <Badge variant="default">最終</Badge>;
      default:
        return <Badge variant="outline">その他</Badge>;
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
            <Link
              href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/new`}
            >
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
            <Input placeholder="レビューを検索..." className="md:max-w-sm" />
            <Select defaultValue="all">
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="progress">進捗レビュー</SelectItem>
                <SelectItem value="final">最終レビュー</SelectItem>
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
                    <span className="font-medium">レビュー</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(review.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                  {getTypeBadge(review.type)}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/${review.id}`}
                    >
                      詳細
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{review.content}</p>
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
              <Link
                href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/new`}
              >
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
