import { Calendar, Edit, MessageSquare, } from "lucide-react";
import Link from "next/link";
import { getReviewAction } from "@/actions/okr";
import { DeleteReviewButton } from "@/components/review/DeleteReviewButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReviewDetailPage({
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
            <h1 className="text-3xl font-bold">レビュー詳細</h1>
            <p className="text-muted-foreground mt-2">レビューの詳細情報</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link
                href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews`}
              >
                一覧に戻る
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href={`/teams/${params.teamId}/okrs/${params.okrId}/reviews/${params.reviewId}/edit`}
              >
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Link>
            </Button>
            <DeleteReviewButton
              reviewId={params.reviewId}
              teamId={params.teamId}
              okrId={params.okrId}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>レビュー</CardTitle>
              </div>
              {getTypeBadge(review.type)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                作成日: {new Date(review.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
          </div>
          {review.updatedAt !== review.createdAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                更新日: {new Date(review.updatedAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">レビュー内容</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="leading-relaxed whitespace-pre-wrap">
                  {review.content}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" asChild>
          <Link href={`/teams/${params.teamId}/okrs/${params.okrId}`}>
            OKRに戻る
          </Link>
        </Button>
      </div>
    </div>
  );
}
