"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { type UpdateReviewInput, updateReviewAction } from "@/actions/okr";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const updateReviewFormSchema = z.object({
  content: z
    .string()
    .min(1, "レビュー内容は必須です")
    .max(2000, "レビュー内容は2000文字以内で入力してください"),
});

type UpdateReviewFormValues = z.infer<typeof updateReviewFormSchema>;

interface ReviewEditFormProps {
  reviewId: string;
  teamId: string;
  okrId: string;
  initialContent: string;
}

export function ReviewEditForm({
  reviewId,
  teamId,
  okrId,
  initialContent,
}: ReviewEditFormProps) {
  const router = useRouter();

  const form = useForm<UpdateReviewFormValues>({
    resolver: zodResolver(updateReviewFormSchema),
    defaultValues: {
      content: initialContent,
    },
  });

  const onSubmit = async (values: UpdateReviewFormValues) => {
    try {
      const input: UpdateReviewInput = {
        content: values.content.trim(),
      };

      const result = await updateReviewAction(reviewId, input);

      if (result.success) {
        toast.success("レビューを更新しました");
        router.push(`/teams/${teamId}/okrs/${okrId}/reviews/${reviewId}`);
      } else {
        toast.error(result.error || "レビューの更新に失敗しました");
      }
    } catch (_error) {
      toast.error("レビューの更新に失敗しました");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>レビュー内容 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="レビュー内容を入力してください..."
                  rows={8}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2 pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "更新中..." : "更新"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/teams/${teamId}/okrs/${okrId}/reviews/${reviewId}`)
            }
          >
            キャンセル
          </Button>
        </div>
      </form>
    </Form>
  );
}
