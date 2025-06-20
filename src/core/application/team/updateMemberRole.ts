import {
  type TeamId,
  type TeamMember,
  teamIdSchema,
} from "@/core/domain/team/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const updateMemberRoleInputSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
  targetUserId: userIdSchema,
  role: z.enum(["admin", "member", "viewer"]),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleInputSchema>;

export async function updateMemberRole(
  context: Context<unknown>,
  input: UpdateMemberRoleInput,
): Promise<Result<TeamMember, ApplicationError>> {
  const parseResult = validate(updateMemberRoleInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { teamId, userId, targetUserId, role } = parseResult.value;

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
      new ApplicationError("User is not authorized to update member roles"),
    );
  }

  // Check if there will be at least one admin after the role change
  if (userId === targetUserId && role !== "admin") {
    const membersResult = await context.teamMemberRepository.list({
      teamId,
      pagination: { page: 1, limit: 100, order: "asc", orderBy: "joinedAt" },
    });

    if (membersResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to check team members",
          membersResult.error,
        ),
      );
    }

    const adminCount = membersResult.value.items.filter(
      (m) => m.role === "admin",
    ).length;
    if (adminCount === 1) {
      return err(
        new ApplicationError("Cannot remove the last admin from the team"),
      );
    }
  }

  // Update member role
  const updateResult = await context.teamMemberRepository.updateRole(
    teamId,
    targetUserId,
    role,
  );

  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update member role", updateResult.error),
    );
  }

  // Return the updated member information
  const updatedMemberResult =
    await context.teamMemberRepository.getByTeamAndUser(teamId, targetUserId);

  if (updatedMemberResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to retrieve updated member",
        updatedMemberResult.error,
      ),
    );
  }

  if (!updatedMemberResult.value) {
    return err(new ApplicationError("Updated member not found"));
  }

  return ok(updatedMemberResult.value);
}
