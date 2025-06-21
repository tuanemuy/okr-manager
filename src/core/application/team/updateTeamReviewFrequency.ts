import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import {
  reviewFrequencySchema,
  type Team,
  teamIdSchema,
} from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const updateTeamReviewFrequencyInputSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
  reviewFrequency: reviewFrequencySchema,
});

export type UpdateTeamReviewFrequencyInput = z.infer<
  typeof updateTeamReviewFrequencyInputSchema
>;

export async function updateTeamReviewFrequency(
  context: Context,
  input: UpdateTeamReviewFrequencyInput,
): Promise<Result<Team, ApplicationError>> {
  const parseResult = validate(updateTeamReviewFrequencyInputSchema, input);
  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { teamId, userId, reviewFrequency } = parseResult.value;

  // Check if user is admin of the team
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    teamId,
    userId,
  );

  if (
    memberResult.isErr() ||
    !memberResult.value ||
    memberResult.value.role !== "admin"
  ) {
    return err(
      new ApplicationError("User is not authorized to update team settings"),
    );
  }

  // Update team review frequency
  const updateResult = await context.teamRepository.update(teamId, {
    reviewFrequency,
  });

  if (updateResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to update team review frequency",
        updateResult.error,
      ),
    );
  }

  const team = updateResult.value;
  if (!team) {
    return err(new ApplicationError("Team not found"));
  }

  return ok(team);
}
