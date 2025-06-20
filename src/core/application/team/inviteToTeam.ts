import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Invitation } from "@/core/domain/team/types";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const inviteToTeamInputSchema = z.object({
  teamId: teamIdSchema,
  invitedEmail: z.string().email(),
  invitedById: userIdSchema,
  role: z.enum(["admin", "member", "viewer"]),
});
export type InviteToTeamInput = z.infer<typeof inviteToTeamInputSchema>;

export async function inviteToTeam(
  context: Context,
  input: InviteToTeamInput,
): Promise<Result<Invitation, ApplicationError>> {
  const parseResult = inviteToTeamInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(
      new ApplicationError("Invalid invitation input", parseResult.error),
    );
  }

  const params = parseResult.data;

  // Check if inviter is team admin
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    params.teamId,
    params.invitedById,
  );

  if (memberResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check team membership",
        memberResult.error,
      ),
    );
  }

  if (!memberResult.value || memberResult.value.role !== "admin") {
    return err(new ApplicationError("Only team admins can invite members"));
  }

  // Check if user is already a team member
  const existingUserResult = await context.userRepository.getByEmail(
    params.invitedEmail,
  );
  if (existingUserResult.isOk() && existingUserResult.value) {
    const existingMemberResult =
      await context.teamMemberRepository.getByTeamAndUser(
        params.teamId,
        existingUserResult.value.id,
      );
    if (existingMemberResult.isOk() && existingMemberResult.value) {
      return err(new ApplicationError("User is already a team member"));
    }
  }

  // Check if there's already a pending invitation
  const existingInvitationResult =
    await context.invitationRepository.getByTeamAndEmail(
      params.teamId,
      params.invitedEmail,
    );
  if (existingInvitationResult.isOk() && existingInvitationResult.value) {
    return err(new ApplicationError("User already has a pending invitation"));
  }

  // Create invitation
  const createResult = await context.invitationRepository.create({
    teamId: params.teamId,
    invitedEmail: params.invitedEmail,
    invitedById: params.invitedById,
    role: params.role,
  });

  return createResult.mapErr(
    (error) => new ApplicationError("Failed to create invitation", error),
  );
}
