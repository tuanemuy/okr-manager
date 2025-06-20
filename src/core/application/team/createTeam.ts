import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Team } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const createTeamInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ownerId: userIdSchema,
});
export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

export async function createTeam(
  context: Context,
  input: CreateTeamInput,
): Promise<Result<Team, ApplicationError>> {
  const parseResult = createTeamInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ApplicationError("Invalid team input", parseResult.error));
  }

  const params = parseResult.data;

  // Create team
  const teamResult = await context.teamRepository.create({
    name: params.name,
    creatorId: params.ownerId,
    description: params.description,
  });

  if (teamResult.isErr()) {
    return err(new ApplicationError("Failed to create team", teamResult.error));
  }

  const team = teamResult.value;

  // Add creator as team admin
  const memberResult = await context.teamMemberRepository.create(
    team.id,
    params.ownerId,
    "admin",
  );

  if (memberResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to add team creator as admin",
        memberResult.error,
      ),
    );
  }

  return ok(team);
}
