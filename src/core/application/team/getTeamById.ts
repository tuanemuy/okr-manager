import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { type Team, teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const getTeamByIdInputSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
});

export type GetTeamByIdInput = z.infer<typeof getTeamByIdInputSchema>;

export async function getTeamById(
  context: Context<unknown>,
  input: GetTeamByIdInput,
): Promise<Result<Team, ApplicationError>> {
  const parseResult = validate(getTeamByIdInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { teamId, userId } = parseResult.value;

  // Check team membership and get team details in parallel
  const [memberResult, teamResult] = await Promise.all([
    context.teamMemberRepository.getByTeamAndUser(teamId, userId),
    context.teamRepository.getById(teamId),
  ]);

  if (memberResult.isErr() || !memberResult.value) {
    return err(new ApplicationError("User is not a member of this team"));
  }

  if (teamResult.isErr()) {
    return err(new ApplicationError("Failed to get team", teamResult.error));
  }

  if (!teamResult.value) {
    return err(new ApplicationError("Team not found"));
  }

  return ok(teamResult.value);
}
