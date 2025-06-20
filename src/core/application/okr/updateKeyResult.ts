import type { KeyResult, KeyResultId } from "@/core/domain/okr/types";
import { keyResultIdSchema } from "@/core/domain/okr/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const updateKeyResultInputSchema = z.object({
  keyResultId: keyResultIdSchema,
  userId: userIdSchema,
  title: z.string().min(1).max(200).optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().optional(),
});
export type UpdateKeyResultInput = z.infer<typeof updateKeyResultInputSchema>;

export async function updateKeyResult(
  context: Context,
  input: UpdateKeyResultInput,
): Promise<Result<KeyResult, ApplicationError>> {
  const parseResult = validate(updateKeyResultInputSchema, input);
  if (parseResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid update key result input",
        parseResult.error,
      ),
    );
  }

  const { keyResultId, userId, ...updateParams } = parseResult.value;

  // Get the existing key result to verify permissions
  const keyResultResult =
    await context.keyResultRepository.getById(keyResultId);
  if (keyResultResult.isErr()) {
    return err(
      new ApplicationError("Failed to get key result", keyResultResult.error),
    );
  }

  const keyResult = keyResultResult.value;
  if (!keyResult) {
    return err(new ApplicationError("Key result not found"));
  }

  // Get the associated OKR
  const okrResult = await context.okrRepository.getById(keyResult.okrId);
  if (okrResult.isErr()) {
    return err(new ApplicationError("Failed to get OKR", okrResult.error));
  }

  const okr = okrResult.value;
  if (!okr) {
    return err(new ApplicationError("OKR not found"));
  }

  // Check permissions: user must be the owner or admin of the team
  const teamMemberResult = await context.teamMemberRepository.getByTeamAndUser(
    okr.teamId,
    userId,
  );
  if (teamMemberResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check team membership",
        teamMemberResult.error,
      ),
    );
  }

  const teamMember = teamMemberResult.value;
  if (!teamMember) {
    return err(new ApplicationError("User is not a member of this team"));
  }

  // Only allow owner or admin to edit
  const isOwner = okr.ownerId === userId;
  const isAdmin = teamMember.role === "admin";
  if (!isOwner && !isAdmin) {
    return err(
      new ApplicationError("Insufficient permissions to edit this key result"),
    );
  }

  // Update the key result
  const updateResult = await context.keyResultRepository.update(
    keyResultId,
    updateParams,
  );
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update key result", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
