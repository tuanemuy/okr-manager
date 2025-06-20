"use client";

import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { createReviewAction } from "@/actions/okr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface CreateReviewFormProps {
  teamId: string;
  okrId: string;
  okrTitle: string;
}

export function CreateReviewForm({
  teamId,
  okrId,
  okrTitle,
}: CreateReviewFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await createReviewAction(okrId, formData);
        // The action will redirect to the reviews page
      } catch (error) {
        console.error("Failed to create review:", error);
        alert("レビューの作成に失敗しました");
      }
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/teams/${teamId}/okrs/${okrId}/reviews`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">新しいレビュー</h1>
            <p className="text-muted-foreground mt-2">OKR: {okrTitle}</p>
          </div>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              レビュー情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reviewType">レビュータイプ *</Label>
              <Select name="reviewType" defaultValue="mid">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mid">中間レビュー</SelectItem>
                  <SelectItem value="final">最終レビュー</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                中間レビューは進捗確認、最終レビューは四半期末の総括に使用します
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">レビュー内容 *</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="進捗状況、課題、今後のアクション等を記入してください..."
                rows={8}
                required
                className="min-h-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                具体的な進捗、達成できたこと、課題、改善点、次のアクションプランを含めてください
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>レビューガイド</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">レビューに含めるべき内容:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>各Key Resultの具体的な進捗状況</li>
                  <li>達成できた成果と要因</li>
                  <li>直面した課題や障害</li>
                  <li>学習したことや改善点</li>
                  <li>次の期間での具体的なアクションプラン</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">効果的なレビューのコツ:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>数値データを具体的に記載する</li>
                  <li>客観的な事実と主観的な感想を分けて記載する</li>
                  <li>チームメンバーからのフィードバックも含める</li>
                  <li>次のアクションが明確で実行可能である</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-4">
          <Link href={`/teams/${teamId}/okrs/${okrId}/reviews`}>
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? "作成中..." : "レビューを作成"}
          </Button>
        </div>
      </form>
    </div>
  );
}
