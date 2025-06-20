import { getReviewAction } from "@/actions/okr";
import { ReviewEditForm } from "@/components/review/ReviewEditForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function ReviewEditPage({
  params,
}: {
  params: { teamId: string; okrId: string; reviewId: string };
}) {
  const review = await getReviewAction(params.reviewId);

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
            <h1 className="text-3xl font-bold">レビュー編集</h1>
            <p className="text-muted-foreground mt-2">
              レビュー内容を編集
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/${params.reviewId}`}>
              キャンセル
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>レビュー情報</CardTitle>
              </div>
              {getTypeBadge(review.type)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>作成日: {new Date(review.createdAt).toLocaleDateString("ja-JP")}</span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>レビュー内容</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewEditForm
              reviewId={params.reviewId}
              teamId={params.teamId}
              okrId={params.okrId}
              initialContent={review.content}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}