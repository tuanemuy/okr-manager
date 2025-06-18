import type { TeamMember } from "@/core/domain/team/types";
import { invitationIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const acceptInvitationInputSchema = z.object({
  invitationId: invitationIdSchema,
  userId: userIdSchema,
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>;

export async function acceptInvitation(
  context: Context,
  input: AcceptInvitationInput,
): Promise<Result<TeamMember, ApplicationError>> {
  const parseResult = acceptInvitationInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const params = parseResult.data;

  // Get invitation
  const invitationResult = await context.invitationRepository.getById(
    params.invitationId,
  );
  if (invitationResult.isErr()) {
    return err(
      new ApplicationError("Failed to get invitation", invitationResult.error),
    );
  }

  const invitation = invitationResult.value;
  if (!invitation) {
    return err(new ApplicationError("Invitation not found"));
  }

  if (invitation.status !== "pending") {
    return err(new ApplicationError("Invitation is not pending"));
  }

  // Get user to verify email matches
  const userResult = await context.userRepository.getById(params.userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to get user", userResult.error));
  }

  const user = userResult.value;
  if (!user || user.email !== invitation.invitedEmail) {
    return err(new ApplicationError("User email does not match invitation"));
  }

  // Check if user is already a team member
  const existingMemberResult =
    await context.teamMemberRepository.getByTeamAndUser(
      invitation.teamId,
      params.userId,
    );
  if (existingMemberResult.isOk() && existingMemberResult.value) {
    return err(new ApplicationError("User is already a team member"));
  }

  // Create team member
  const memberResult = await context.teamMemberRepository.create(
    invitation.teamId,
    params.userId,
    invitation.role,
  );

  if (memberResult.isErr()) {
    return err(
      new ApplicationError("Failed to create team member", memberResult.error),
    );
  }

  // Update invitation status
  const updateResult = await context.invitationRepository.updateStatus(
    params.invitationId,
    "accepted",
  );

  if (updateResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to update invitation status",
        updateResult.error,
      ),
    );
  }

  return memberResult;
}
