"use server";

import { acceptInvitation } from "@/core/application/team/acceptInvitation";
import { createTeam } from "@/core/application/team/createTeam";
import { inviteToTeam } from "@/core/application/team/inviteToTeam";
import { invitationIdSchema, teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { getUserIdFromSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { context } from "./context";

export async function createTeamAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await createTeam(context, {
    name,
    description: description || undefined,
    ownerId: getUserIdFromSession(session),
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath("/teams");
  redirect("/teams");
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
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await context.teamRepository.listByUserId(
    getUserIdFromSession(session),
  );

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

export async function getTeamAction(teamId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const teamResult = await context.teamRepository.findById(
    teamIdSchema.parse(teamId),
  );
  if (teamResult.isErr()) {
    throw new Error(teamResult.error.message);
  }

  return teamResult.value;
}

export async function getTeamMembersAction(teamId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const result = await context.teamMemberRepository.list({
    teamId: teamIdSchema.parse(teamId),
    pagination: { page: 1, limit: 100, order: "asc", orderBy: "joinedAt" },
  });
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

export async function removeTeamMemberAction(teamId: string, userId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  // Check if user is admin of the team
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    teamIdSchema.parse(teamId),
    getUserIdFromSession(session),
  );
  if (
    memberResult.isErr() ||
    !memberResult.value ||
    memberResult.value.role !== "admin"
  ) {
    throw new Error("Not authorized");
  }

  const result = await context.teamMemberRepository.delete(
    teamIdSchema.parse(teamId),
    userIdSchema.parse(userId),
  );
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/teams/${teamId}/members`);
}

export async function updateTeamMemberRoleAction(
  teamId: string,
  userId: string,
  role: "admin" | "member" | "viewer",
) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  // Check if user is admin of the team
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    teamIdSchema.parse(teamId),
    getUserIdFromSession(session),
  );
  if (
    memberResult.isErr() ||
    !memberResult.value ||
    memberResult.value.role !== "admin"
  ) {
    throw new Error("Not authorized");
  }

  const result = await context.teamMemberRepository.updateRole(
    teamIdSchema.parse(teamId),
    userIdSchema.parse(userId),
    role,
  );
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/teams/${teamId}/members`);
}
