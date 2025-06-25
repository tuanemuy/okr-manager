import { err, type Result } from "neverthrow";
import { z } from "zod/v4";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
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

  // Check if user is a member of the team
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    teamId,
    userId,
  );

  if (memberResult.isErr() || !memberResult.value) {
    return err(new ApplicationError("User is not a member of this team"));
  }

  // Check if user is admin
  if (memberResult.value.role !== "admin") {
    return err(new ApplicationError("Only admins can remove team members"));
  }

  // Check if target user is a member of the team
  const targetMemberResult =
    await context.teamMemberRepository.getByTeamAndUser(teamId, targetUserId);

  if (targetMemberResult.isErr() || !targetMemberResult.value) {
    return err(
      new ApplicationError("Target user is not a member of this team"),
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
