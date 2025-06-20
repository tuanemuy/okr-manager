import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { TeamRepository } from "@/core/domain/team/ports/teamRepository";
import type { Team } from "@/core/domain/team/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const getTeamsByUserIdInputSchema = z.object({
  userId: userIdSchema,
});

export type GetTeamsByUserIdInput = z.infer<typeof getTeamsByUserIdInputSchema>;

export async function getTeamsByUserId(
  context: Context<unknown>,
  input: GetTeamsByUserIdInput,
): Promise<Result<{ teams: Team[] }, ApplicationError>> {
  const parseResult = validate(getTeamsByUserIdInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { userId } = parseResult.value;

  const result = await context.teamRepository.listByUserId(userId);

  if (result.isErr()) {
    return err(new ApplicationError("Failed to get teams", result.error));
  }

  return ok({ teams: result.value });
}
