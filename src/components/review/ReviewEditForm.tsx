"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { type UpdateReviewInput, updateReviewAction } from "@/actions/okr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim() === "") {
      toast.error("レビュー内容は必須です");
      return;
    }

    try {
      setIsSubmitting(true);

      const input: UpdateReviewInput = {
        content: content.trim(),
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          レビュー内容 *
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="レビュー内容を入力してください..."
          rows={8}
          className="resize-none"
          required
        />
      </div>

      <div className="flex items-center gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || content.trim() === ""}>
          {isSubmitting ? "更新中..." : "更新"}
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
  );
}
