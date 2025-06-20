import {
  type TeamId,
  type TeamMemberWithUser,
  teamIdSchema,
} from "@/core/domain/team/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const getTeamMembersInputSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
});

export type GetTeamMembersInput = z.infer<typeof getTeamMembersInputSchema>;

export async function getTeamMembers(
  context: Context<unknown>,
  input: GetTeamMembersInput,
): Promise<
  Result<{ items: TeamMemberWithUser[]; totalCount: number }, ApplicationError>
> {
  const parseResult = validate(getTeamMembersInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { teamId, userId } = parseResult.value;

  // Check if user is a member of the team
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    teamId,
    userId,
  );

  if (memberResult.isErr() || !memberResult.value) {
    return err(new ApplicationError("User is not a member of this team"));
  }

  // Get team members
  const membersResult = await context.teamMemberRepository.list({
    teamId,
    pagination: { page: 1, limit: 100, order: "asc", orderBy: "joinedAt" },
  });

  if (membersResult.isErr()) {
    return err(
      new ApplicationError("Failed to get team members", membersResult.error),
    );
  }

  return ok({
    items: membersResult.value.items,
    totalCount: membersResult.value.count,
  });
}
