import { type TeamId, teamIdSchema } from "@/core/domain/team/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const removeMemberFromTeamInputSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
  targetUserId: userIdSchema,
});

export type RemoveMemberFromTeamInput = z.infer<
  typeof removeMemberFromTeamInputSchema
>;

export async function removeMemberFromTeam(
  context: Context<unknown>,
  input: RemoveMemberFromTeamInput,
): Promise<Result<void, ApplicationError>> {
  const parseResult = validate(removeMemberFromTeamInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { teamId, userId, targetUserId } = parseResult.value;

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
      new ApplicationError("User is not authorized to remove team members"),
    );
  }

  // Cannot remove yourself
  if (userId === targetUserId) {
    return err(new ApplicationError("Cannot remove yourself from the team"));
  }

  // Remove member
  const removeResult = await context.teamMemberRepository.delete(
    teamId,
    targetUserId,
  );

  return removeResult.mapErr(
    (error) => new ApplicationError("Failed to remove team member", error),
  );
}
