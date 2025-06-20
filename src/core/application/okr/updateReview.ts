import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import { validate } from "@/lib/validation";
import type { Context } from "../context";
import { ApplicationError } from "@/lib/error";
import { reviewIdSchema, type Review } from "@/core/domain/okr/types";
import { userIdSchema } from "@/core/domain/user/types";

export const updateReviewInputSchema = z.object({
  reviewId: reviewIdSchema,
  userId: userIdSchema,
  content: z.string().min(1).optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;

export async function updateReview(
  context: Context,
  input: UpdateReviewInput,
): Promise<Result<Review, ApplicationError>> {
  const parseResult = validate(updateReviewInputSchema, input);
  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { reviewId, userId, content } = parseResult.value;

  // Get the review to check permissions
  const reviewResult = await context.reviewRepository.findById(reviewId);
  if (reviewResult.isErr()) {
    return err(new ApplicationError("Failed to get review", reviewResult.error));
  }

  if (!reviewResult.value) {
    return err(new ApplicationError("Review not found"));
  }

  const review = reviewResult.value;

  // Check if user is the reviewer (owner of the review)
  if (review.reviewerId !== userId) {
    return err(new ApplicationError("Unauthorized: You can only edit your own reviews"));
  }

  // Update the review
  const updateParams = {
    ...(content !== undefined && { content }),
  };

  if (Object.keys(updateParams).length === 0) {
    return err(new ApplicationError("No fields to update"));
  }

  const updateResult = await context.reviewRepository.update(reviewId, updateParams);
  if (updateResult.isErr()) {
    return err(new ApplicationError("Failed to update review", updateResult.error));
  }

  return ok(updateResult.value);
}