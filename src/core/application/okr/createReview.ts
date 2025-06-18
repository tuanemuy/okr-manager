import type { Review } from "@/core/domain/okr/types";
import { okrIdSchema } from "@/core/domain/okr/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const createReviewInputSchema = z.object({
  okrId: okrIdSchema,
  type: z.enum(["progress", "final"]),
  content: z.string().min(1).max(2000),
  reviewerId: userIdSchema,
});
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

export async function createReview(
  context: Context,
  input: CreateReviewInput,
): Promise<Result<Review, ApplicationError>> {
  const parseResult = createReviewInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ApplicationError("Invalid review input", parseResult.error));
  }

  const params = parseResult.data;

  // Get OKR to check permissions
  const okrResult = await context.okrRepository.getById(params.okrId);
  if (okrResult.isErr()) {
    return err(new ApplicationError("Failed to get OKR", okrResult.error));
  }

  const okr = okrResult.value;
  if (!okr) {
    return err(new ApplicationError("OKR not found"));
  }

  // Check if user is team member
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    okr.teamId,
    params.reviewerId,
  );

  if (memberResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check team membership",
        memberResult.error,
      ),
    );
  }

  const member = memberResult.value;
  if (!member) {
    return err(new ApplicationError("User is not a team member"));
  }

  // Only admins or the OKR owner can create reviews
  const canReview =
    member.role === "admin" ||
    (okr.ownerId && okr.ownerId === params.reviewerId);

  if (!canReview) {
    return err(
      new ApplicationError(
        "Permission denied: only OKR owner or team admin can create reviews",
      ),
    );
  }

  // Create review
  return await context.reviewRepository.create({
    okrId: params.okrId,
    type: params.type,
    content: params.content,
    reviewerId: params.reviewerId,
  });
}
