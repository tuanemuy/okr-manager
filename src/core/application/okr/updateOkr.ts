import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Okr, OkrId } from "@/core/domain/okr/types";
import { okrIdSchema } from "@/core/domain/okr/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const updateOkrInputSchema = z.object({
  okrId: okrIdSchema,
  userId: userIdSchema,
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});
export type UpdateOkrInput = z.infer<typeof updateOkrInputSchema>;

export async function updateOkr(
  context: Context,
  input: UpdateOkrInput,
): Promise<Result<Okr, ApplicationError>> {
  const parseResult = validate(updateOkrInputSchema, input);
  if (parseResult.isErr()) {
    return err(
      new ApplicationError("Invalid update OKR input", parseResult.error),
    );
  }

  const { okrId, userId, ...updateParams } = parseResult.value;

  // Get the existing OKR to verify permissions
  const okrResult = await context.okrRepository.getById(okrId);
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
      new ApplicationError("Insufficient permissions to edit this OKR"),
    );
  }

  // Update the OKR
  const updateResult = await context.okrRepository.update(okrId, updateParams);
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update OKR", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
