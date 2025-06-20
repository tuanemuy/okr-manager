import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { type Team, teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const updateTeamReviewFrequencyInputSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
  reviewFrequency: z.enum(["weekly", "biweekly", "monthly"]),
});

export type UpdateTeamReviewFrequencyInput = z.infer<
  typeof updateTeamReviewFrequencyInputSchema
>;

export async function updateTeamReviewFrequency(
  context: Context,
  input: UpdateTeamReviewFrequencyInput,
): Promise<Result<Team, ApplicationError>> {
  const parseResult = updateTeamReviewFrequencyInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { teamId, userId, reviewFrequency } = parseResult.data;

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

  // TODO: Add reviewFrequency field to team schema and update types
  // For now, return the team unchanged since reviewFrequency is not implemented in the schema
  const teamResult = await context.teamRepository.getById(teamId);

  if (teamResult.isErr()) {
    return err(new ApplicationError("Failed to get team", teamResult.error));
  }

  const team = teamResult.value;
  if (!team) {
    return err(new ApplicationError("Team not found"));
  }

  // TODO: Implement actual review frequency update when schema is updated
  return ok(team);
}
