"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { context } from "@/context";
import { invitationIdSchema } from "@/core/domain/team/types";
import { getUserEmailFromSession, getUserIdFromSession } from "@/lib/session";
import { requireAuth } from "./session";

export async function acceptInvitationAction(invitationId: string) {
  try {
    // Validate invitation ID format
    const validInvitationId = invitationIdSchema.parse(invitationId);

    const sessionResult = await context.sessionManager.get();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error("Not authenticated");
    }

    const session = sessionResult.value;

    // Get invitation details
    const invitationResult =
      await context.invitationRepository.getById(validInvitationId);
    if (invitationResult.isErr() || !invitationResult.value) {
      throw new Error("Invitation not found");
    }

    const invitation = invitationResult.value;

    // Verify the invitation is for this user
    if (invitation.invitedEmail !== getUserEmailFromSession(session)) {
      throw new Error("This invitation is not for you");
    }

    if (invitation.status !== "pending") {
      throw new Error("This invitation has already been processed");
    }

    // Create team membership
    const memberResult = await context.teamMemberRepository.create(
      invitation.teamId,
      getUserIdFromSession(session),
      invitation.role,
    );

    if (memberResult.isErr()) {
      throw new Error(memberResult.error.message);
    }

    // Update invitation status
    const updateResult = await context.invitationRepository.updateStatus(
      validInvitationId,
      "accepted",
    );
    if (updateResult.isErr()) {
      throw new Error(updateResult.error.message);
    }

    revalidatePath("/invitations");
    revalidatePath("/teams");
    redirect("/teams");
  } catch (error) {
    console.error("Error in acceptInvitationAction:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
}

export async function rejectInvitationAction(invitationId: string) {
  try {
    // Validate invitation ID format
    const validInvitationId = invitationIdSchema.parse(invitationId);

    const sessionResult = await context.sessionManager.get();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error("Not authenticated");
    }

    const session = sessionResult.value;

    // Get invitation details
    const invitationResult =
      await context.invitationRepository.getById(validInvitationId);
    if (invitationResult.isErr() || !invitationResult.value) {
      throw new Error("Invitation not found");
    }

    const invitation = invitationResult.value;

    // Verify the invitation is for this user
    if (invitation.invitedEmail !== getUserEmailFromSession(session)) {
      throw new Error("This invitation is not for you");
    }

    if (invitation.status !== "pending") {
      throw new Error("This invitation has already been processed");
    }

    // Update invitation status
    const updateResult = await context.invitationRepository.updateStatus(
      validInvitationId,
      "rejected",
    );
    if (updateResult.isErr()) {
      throw new Error(updateResult.error.message);
    }

    revalidatePath("/invitations");
  } catch (error) {
    console.error("Error in rejectInvitationAction:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
}

export async function getInvitationsAction() {
  try {
    const session = await requireAuth();

    const result = await context.invitationRepository.listByEmail(
      getUserEmailFromSession(session),
    );

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // Filter to only pending invitations
    const pendingInvitations = result.value.filter(
      (inv) => inv.status === "pending",
    );

    return {
      success: true,
      data: pendingInvitations,
    };
  } catch (error) {
    console.error("Error in getInvitationsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getInvitationAction(invitationId: string) {
  try {
    const session = await requireAuth();

    const result = await context.invitationRepository.getById(
      invitationIdSchema.parse(invitationId),
    );

    if (result.isErr() || !result.value) {
      return {
        success: false,
        error: "Invitation not found",
      };
    }

    const invitation = result.value;

    // Verify the invitation is for this user
    if (invitation.invitedEmail !== getUserEmailFromSession(session)) {
      return {
        success: false,
        error: "This invitation is not for you",
      };
    }

    return {
      success: true,
      data: invitation,
    };
  } catch (error) {
    console.error("Error in getInvitationAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
