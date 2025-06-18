"use server";

import { invitationIdSchema } from "@/core/domain/team/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { context } from "./context";

export async function acceptInvitationAction(invitationId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  // Get invitation details
  const invitationResult = await context.invitationRepository.getById(
    invitationIdSchema.parse(invitationId),
  );
  if (invitationResult.isErr() || !invitationResult.value) {
    throw new Error("Invitation not found");
  }

  const invitation = invitationResult.value;

  // Verify the invitation is for this user
  if (invitation.invitedEmail !== session.email) {
    throw new Error("This invitation is not for you");
  }

  if (invitation.status !== "pending") {
    throw new Error("This invitation has already been processed");
  }

  // Create team membership
  const memberResult = await context.teamMemberRepository.create(
    invitation.teamId,
    session.userId,
    invitation.role,
  );

  if (memberResult.isErr()) {
    throw new Error(memberResult.error.message);
  }

  // Update invitation status
  const updateResult = await context.invitationRepository.updateStatus(
    invitationIdSchema.parse(invitationId),
    "accepted",
  );
  if (updateResult.isErr()) {
    throw new Error(updateResult.error.message);
  }

  revalidatePath("/invitations");
  revalidatePath("/teams");
  redirect("/teams");
}

export async function rejectInvitationAction(invitationId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  // Get invitation details
  const invitationResult = await context.invitationRepository.getById(
    invitationIdSchema.parse(invitationId),
  );
  if (invitationResult.isErr() || !invitationResult.value) {
    throw new Error("Invitation not found");
  }

  const invitation = invitationResult.value;

  // Verify the invitation is for this user
  if (invitation.invitedEmail !== session.email) {
    throw new Error("This invitation is not for you");
  }

  if (invitation.status !== "pending") {
    throw new Error("This invitation has already been processed");
  }

  // Update invitation status
  const updateResult = await context.invitationRepository.updateStatus(
    invitationIdSchema.parse(invitationId),
    "rejected",
  );
  if (updateResult.isErr()) {
    throw new Error(updateResult.error.message);
  }

  revalidatePath("/invitations");
}
