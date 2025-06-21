import { err, type Result } from "neverthrow";
import { z } from "zod/v4";
import { type Team, teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const updateTeamInputSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamInputSchema>;

export async function updateTeam(
  context: Context,
  input: UpdateTeamInput,
): Promise<Result<Team, ApplicationError>> {
  const parseResult = updateTeamInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { teamId, userId, name, description } = parseResult.data;

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
      new ApplicationError("User is not authorized to update this team"),
    );
  }

  // Update team
  const updateResult = await context.teamRepository.update(teamId, {
    name,
    description: description ?? undefined,
  });

  return updateResult.mapErr(
    (error) => new ApplicationError("Failed to update team", error),
  );
}
