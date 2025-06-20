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
import { invitationIdSchema, teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { getUserIdFromSession } from "@/lib/session";
import { requireAuth } from "./session";

const createTeamInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

export async function createTeamAction(input: CreateTeamInput) {
  try {
    const session = await requireAuth();
    const validInput = createTeamInputSchema.parse(input);

    const result = await createTeam(context, {
      name: validInput.name,
      description: validInput.description,
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

export async function inviteToTeamAction(teamId: string, formData: FormData) {
  const email = formData.get("email") as string;

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await inviteToTeam(context, {
    teamId: teamIdSchema.parse(teamId),
    invitedEmail: email,
    invitedById: getUserIdFromSession(session),
    role: "member", // Default role for invited users
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/teams/${teamId}/members`);
}

export async function acceptInvitationAction(invitationId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await acceptInvitation(context, {
    invitationId: invitationIdSchema.parse(invitationId),
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

    const result = await getTeamById(context, {
      teamId: teamIdSchema.parse(teamId),
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

    const result = await getTeamMembers(context, {
      teamId: teamIdSchema.parse(teamId),
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

    const result = await removeMemberFromTeam(context, {
      teamId: teamIdSchema.parse(teamId),
      userId: getUserIdFromSession(session),
      targetUserId: userIdSchema.parse(targetUserId),
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

    const result = await updateMemberRole(context, {
      teamId: teamIdSchema.parse(teamId),
      userId: getUserIdFromSession(session),
      targetUserId: userIdSchema.parse(targetUserId),
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
    const validInput = updateTeamInputSchema.parse(input);

    const result = await updateTeam(context, {
      teamId: teamIdSchema.parse(teamId),
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

    const result = await updateTeamReviewFrequency(context, {
      teamId: teamIdSchema.parse(teamId),
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

export async function deleteTeamAction(teamId: string) {
  try {
    const session = await requireAuth();

    const result = await deleteTeam(context, {
      teamId: teamIdSchema.parse(teamId),
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
