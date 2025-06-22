"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { context } from "@/context";
import { acceptInvitation } from "@/core/application/team/acceptInvitation";
import { createTeam } from "@/core/application/team/createTeam";
import { deleteTeam } from "@/core/application/team/deleteTeam";
import { getTeamById } from "@/core/application/team/getTeamById";
import { getTeamMembers } from "@/core/application/team/getTeamMembers";
import { getTeamsByUserId } from "@/core/application/team/getTeamsByUserId";
import { inviteToTeam } from "@/core/application/team/inviteToTeam";
import { removeMemberFromTeam } from "@/core/application/team/removeMemberFromTeam";
import { updateMemberRole } from "@/core/application/team/updateMemberRole";
import { updateTeam } from "@/core/application/team/updateTeam";
import { updateTeamReviewFrequency } from "@/core/application/team/updateTeamReviewFrequency";
import {
  type InvitationId,
  invitationIdSchema,
  reviewFrequencySchema,
  type TeamId,
  teamIdSchema,
} from "@/core/domain/team/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { getUserIdFromSession } from "@/lib/session";
import { validate } from "@/lib/validation";
import { requireAuth } from "./session";

const createTeamInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  reviewFrequency: reviewFrequencySchema.default("monthly"),
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

export async function createTeamAction(input: CreateTeamInput) {
  try {
    const session = await requireAuth();
    const validationResult = validate(createTeamInputSchema, input);
    if (validationResult.isErr()) {
      return {
        success: false,
        error: validationResult.error.message,
      };
    }
    const validInput = validationResult.value;

    const result = await createTeam(context, {
      name: validInput.name,
      description: validInput.description,
      reviewFrequency: validInput.reviewFrequency,
      ownerId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath("/teams");
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in createTeamAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

const inviteToTeamFormSchema = z.object({
  email: z.string().email(),
});

export async function inviteToTeamAction(teamId: string, formData: FormData) {
  try {
    const email = formData.get("email");

    // Validate input
    const validationResult = validate(inviteToTeamFormSchema, {
      email,
    });
    if (validationResult.isErr()) {
      throw new Error(validationResult.error.message);
    }
    const validInput = validationResult.value;

    const sessionResult = await context.sessionManager.get();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error("Not authenticated");
    }

    const session = sessionResult.value;

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      throw new Error(teamIdResult.error.message);
    }

    const result = await inviteToTeam(context, {
      teamId: teamIdResult.value as TeamId,
      invitedEmail: validInput.email,
      invitedById: getUserIdFromSession(session),
      role: "member", // Default role for invited users
    });

    if (result.isErr()) {
      throw new Error(result.error.message);
    }

    revalidatePath(`/teams/${teamId}/members`);
  } catch (error) {
    console.error("Error in inviteToTeamAction:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
}

export async function acceptInvitationAction(invitationId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const invitationIdResult = validate(invitationIdSchema, invitationId);
  if (invitationIdResult.isErr()) {
    throw new Error(invitationIdResult.error.message);
  }

  const result = await acceptInvitation(context, {
    invitationId: invitationIdResult.value as InvitationId,
    userId: getUserIdFromSession(session),
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath("/teams");
  redirect("/teams");
}

export async function getTeamsAction() {
  try {
    const session = await requireAuth();

    const result = await getTeamsByUserId(context, {
      userId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in getTeamsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getTeamAction(teamId: string) {
  try {
    const session = await requireAuth();

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    const result = await getTeamById(context, {
      teamId: teamIdResult.value as TeamId,
      userId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in getTeamAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getTeamMembersAction(teamId: string) {
  try {
    const session = await requireAuth();

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    const result = await getTeamMembers(context, {
      teamId: teamIdResult.value as TeamId,
      userId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in getTeamMembersAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function removeTeamMemberAction(
  teamId: string,
  targetUserId: string,
) {
  try {
    const session = await requireAuth();

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    const targetUserIdResult = validate(userIdSchema, targetUserId);
    if (targetUserIdResult.isErr()) {
      return {
        success: false,
        error: targetUserIdResult.error.message,
      };
    }

    const result = await removeMemberFromTeam(context, {
      teamId: teamIdResult.value as TeamId,
      userId: getUserIdFromSession(session),
      targetUserId: targetUserIdResult.value as UserId,
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath(`/teams/${teamId}/members`);
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in removeTeamMemberAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateTeamMemberRoleAction(
  teamId: string,
  targetUserId: string,
  role: "admin" | "member" | "viewer",
) {
  try {
    const session = await requireAuth();

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    const targetUserIdResult = validate(userIdSchema, targetUserId);
    if (targetUserIdResult.isErr()) {
      return {
        success: false,
        error: targetUserIdResult.error.message,
      };
    }

    const result = await updateMemberRole(context, {
      teamId: teamIdResult.value as TeamId,
      userId: getUserIdFromSession(session),
      targetUserId: targetUserIdResult.value as UserId,
      role,
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath(`/teams/${teamId}/members`);
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in updateTeamMemberRoleAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

const updateTeamInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamInputSchema>;

export async function updateTeamAction(teamId: string, input: UpdateTeamInput) {
  try {
    const session = await requireAuth();
    const inputValidationResult = validate(updateTeamInputSchema, input);
    if (inputValidationResult.isErr()) {
      return {
        success: false,
        error: inputValidationResult.error.message,
      };
    }
    const validInput = inputValidationResult.value;

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    const result = await updateTeam(context, {
      teamId: teamIdResult.value as TeamId,
      userId: getUserIdFromSession(session),
      name: validInput.name,
      description: validInput.description,
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath(`/teams/${teamId}`);
    revalidatePath(`/teams/${teamId}/settings`);
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in updateTeamAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateTeamReviewFrequencyAction(
  teamId: string,
  frequency: "weekly" | "biweekly" | "monthly",
) {
  try {
    const session = await requireAuth();

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    const result = await updateTeamReviewFrequency(context, {
      teamId: teamIdResult.value as TeamId,
      userId: getUserIdFromSession(session),
      reviewFrequency: frequency,
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath(`/teams/${teamId}/settings`);
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in updateTeamReviewFrequencyAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getUserTeamRoleAction(teamId: string) {
  try {
    const session = await requireAuth();

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    const result = await context.teamMemberRepository.getUserRole(
      teamIdResult.value as TeamId,
      getUserIdFromSession(session),
    );

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getTeamMemberCountAction(teamId: string) {
  try {
    const session = await requireAuth();

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    // First check if user is a member of the team
    const memberResult = await context.teamMemberRepository.getByTeamAndUser(
      teamIdResult.value as TeamId,
      getUserIdFromSession(session),
    );

    if (memberResult.isErr() || !memberResult.value) {
      return {
        success: false,
        error: "User is not a member of this team",
      };
    }

    const result = await context.teamMemberRepository.countByTeam(
      teamIdResult.value as TeamId,
    );

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteTeamAction(teamId: string) {
  try {
    const session = await requireAuth();

    const teamIdResult = validate(teamIdSchema, teamId);
    if (teamIdResult.isErr()) {
      return {
        success: false,
        error: teamIdResult.error.message,
      };
    }

    const result = await deleteTeam(context, {
      teamId: teamIdResult.value as TeamId,
      userId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath("/teams");
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in deleteTeamAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
