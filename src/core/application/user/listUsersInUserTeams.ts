import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { type User, type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const listUsersInUserTeamsInputSchema = z.object({
  userId: userIdSchema,
});

export type ListUsersInUserTeamsInput = z.infer<
  typeof listUsersInUserTeamsInputSchema
>;

export async function listUsersInUserTeams(
  context: Context<unknown>,
  input: ListUsersInUserTeamsInput,
): Promise<Result<User[], ApplicationError>> {
  const parseResult = validate(listUsersInUserTeamsInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { userId } = parseResult.value;

  try {
    // Get teams the user belongs to
    const teamsResult = await context.teamRepository.listByUserId(userId);

    if (teamsResult.isErr()) {
      return err(
        new ApplicationError("Failed to get user teams", teamsResult.error),
      );
    }

    const userTeams = teamsResult.value;
    const userIds = new Set<UserId>();

    // Get all members from all teams
    for (const team of userTeams) {
      const membersResult = await context.teamMemberRepository.list({
        teamId: team.id,
        pagination: { page: 1, limit: 1000, order: "asc", orderBy: "joinedAt" },
      });

      if (membersResult.isOk()) {
        for (const member of membersResult.value.items) {
          userIds.add(member.userId);
        }
      }
    }

    // Get user details for all unique user IDs
    const users: User[] = [];
    for (const id of userIds) {
      const userResult = await context.userRepository.getById(id);
      if (userResult.isOk() && userResult.value) {
        users.push(userResult.value);
      }
    }

    return ok(users);
  } catch (error) {
    return err(new ApplicationError("Failed to list users in teams", error));
  }
}
