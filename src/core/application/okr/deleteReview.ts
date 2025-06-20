import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { reviewIdSchema } from "@/core/domain/okr/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const deleteReviewInputSchema = z.object({
  reviewId: reviewIdSchema,
  userId: userIdSchema,
});

export type DeleteReviewInput = z.infer<typeof deleteReviewInputSchema>;

export async function deleteReview(
  context: Context,
  input: DeleteReviewInput,
): Promise<Result<void, ApplicationError>> {
  const parseResult = validate(deleteReviewInputSchema, input);
  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { reviewId, userId } = parseResult.value;

  // Get the review to check permissions
  const reviewResult = await context.reviewRepository.findById(reviewId);
  if (reviewResult.isErr()) {
    return err(
      new ApplicationError("Failed to get review", reviewResult.error),
    );
  }

  if (!reviewResult.value) {
    return err(new ApplicationError("Review not found"));
  }

  const review = reviewResult.value;

  // Check if user is the reviewer (owner of the review)
  if (review.reviewerId !== userId) {
    return err(
      new ApplicationError(
        "Unauthorized: You can only delete your own reviews",
      ),
    );
  }

  // Delete the review
  const deleteResult = await context.reviewRepository.delete(reviewId);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete review", deleteResult.error),
    );
  }

  return ok(undefined);
}
