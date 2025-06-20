import { type TeamId, teamIdSchema } from "@/core/domain/team/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { type Result, err } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const deleteTeamInputSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
});

export type DeleteTeamInput = z.infer<typeof deleteTeamInputSchema>;

export async function deleteTeam(
  context: Context,
  input: DeleteTeamInput,
): Promise<Result<void, ApplicationError>> {
  const parseResult = deleteTeamInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { teamId, userId } = parseResult.data;

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
    return new ApplicationError(
      "User is not authorized to delete this team",
    ).toErr();
  }

  // Check if team has other members
  const membersResult = await context.teamMemberRepository.list({
    teamId,
    pagination: { page: 1, limit: 100, order: "asc", orderBy: "joinedAt" },
  });

  if (membersResult.isErr()) {
    return err(
      new ApplicationError("Failed to check team members", membersResult.error),
    );
  }

  if (membersResult.value.items.length > 1) {
    return new ApplicationError(
      "Cannot delete team with other members",
    ).toErr();
  }

  // Delete team
  const deleteResult = await context.teamRepository.delete(teamId);

  return deleteResult.mapErr(
    (error) => new ApplicationError("Failed to delete team", error),
  );
}
