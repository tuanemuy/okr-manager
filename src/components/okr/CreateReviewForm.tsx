"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { createReviewAction } from "@/actions/okr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const createReviewFormSchema = z.object({
  content: z
    .string()
    .min(1, "レビュー内容は必須です")
    .max(2000, "レビュー内容は2000文字以内で入力してください"),
  type: z.enum(["progress", "final"], {
    message: "レビュータイプを選択してください",
  }),
});

type CreateReviewFormValues = z.infer<typeof createReviewFormSchema>;

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
  const router = useRouter();
  const form = useForm<CreateReviewFormValues>({
    resolver: zodResolver(createReviewFormSchema),
    defaultValues: {
      content: "",
      type: "progress",
    },
  });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: CreateReviewFormValues) => {
    startTransition(async () => {
      try {
        setError(null);
        const formData = new FormData();
        formData.append("content", values.content);
        formData.append("reviewType", values.type);

        await createReviewAction(okrId, formData);

        // Navigate back to reviews page on success
        router.push(`/teams/${teamId}/okrs/${okrId}/reviews`);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "レビューの作成に失敗しました",
        );
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                レビュー情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>レビュータイプ *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="レビュータイプを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="progress">中間レビュー</SelectItem>
                        <SelectItem value="final">最終レビュー</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      中間レビューは進捗確認、最終レビューは四半期末の総括に使用します
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>レビュー内容 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="進捗状況、課題、今後のアクション等を記入してください..."
                        rows={8}
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      具体的な進捗、達成できたこと、課題、改善点、次のアクションプランを含めてください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>レビューガイド</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">
                    レビューに含めるべき内容:
                  </h4>
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
      </Form>
    </div>
  );
}
