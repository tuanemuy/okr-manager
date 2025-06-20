import type { KeyResult } from "@/core/domain/okr/types";
import { keyResultIdSchema } from "@/core/domain/okr/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const updateKeyResultProgressInputSchema = z.object({
  keyResultId: keyResultIdSchema,
  currentValue: z.number().min(0),
  userId: userIdSchema,
});
export type UpdateKeyResultProgressInput = z.infer<
  typeof updateKeyResultProgressInputSchema
>;

export async function updateKeyResultProgress(
  context: Context,
  input: UpdateKeyResultProgressInput,
): Promise<Result<KeyResult, ApplicationError>> {
  const parseResult = updateKeyResultProgressInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const params = parseResult.data;

  // Get key result and related OKR
  const keyResultResult = await context.keyResultRepository.getById(
    params.keyResultId,
  );
  if (keyResultResult.isErr()) {
    return err(
      new ApplicationError("Failed to get key result", keyResultResult.error),
    );
  }

  const keyResult = keyResultResult.value;
  if (!keyResult) {
    return err(new ApplicationError("Key result not found"));
  }

  const okrResult = await context.okrRepository.getById(keyResult.okrId);
  if (okrResult.isErr()) {
    return err(new ApplicationError("Failed to get OKR", okrResult.error));
  }

  const okr = okrResult.value;
  if (!okr) {
    return err(new ApplicationError("OKR not found"));
  }

  // Check permissions
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    okr.teamId,
    params.userId,
  );

  if (memberResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check team membership",
        memberResult.error,
      ),
    );
  }

  const member = memberResult.value;
  if (!member) {
    return err(new ApplicationError("User is not a team member"));
  }

  // Only admins or the OKR owner can update progress
  const canUpdate =
    member.role === "admin" || (okr.ownerId && okr.ownerId === params.userId);

  if (!canUpdate) {
    return err(
      new ApplicationError(
        "Permission denied: only OKR owner or team admin can update progress",
      ),
    );
  }

  // Update key result
  const updateResult = await context.keyResultRepository.updateProgress(
    params.keyResultId,
    params.currentValue,
  );

  if (updateResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to update key result progress",
        updateResult.error,
      ),
    );
  }

  return ok(updateResult.value);
}
