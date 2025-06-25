import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";
import { userIdSchema } from "../user/types";

export const teamIdSchema = z.string().uuid().brand("teamId");
export type TeamId = z.infer<typeof teamIdSchema>;

export const teamRoleSchema = z.enum(["admin", "member", "viewer"]);
export type TeamRole = z.infer<typeof teamRoleSchema>;

export const reviewFrequencySchema = z.enum(["weekly", "biweekly", "monthly"]);
export type ReviewFrequency = z.infer<typeof reviewFrequencySchema>;

export const teamSchema = z.object({
  id: teamIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  reviewFrequency: reviewFrequencySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Team = z.infer<typeof teamSchema>;

export const createTeamParamsSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  reviewFrequency: reviewFrequencySchema.default("monthly"),
  creatorId: userIdSchema,
});
export type CreateTeamParams = z.infer<typeof createTeamParamsSchema>;

export const updateTeamParamsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  reviewFrequency: reviewFrequencySchema.optional(),
});
export type UpdateTeamParams = z.infer<typeof updateTeamParamsSchema>;

export const teamMemberSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
  role: teamRoleSchema,
  joinedAt: z.date(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamMemberWithUserSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
  role: teamRoleSchema,
  joinedAt: z.date(),
  user: z.object({
    displayName: z.string(),
    email: z.string().email(),
  }),
});
export type TeamMemberWithUser = z.infer<typeof teamMemberWithUserSchema>;

export const invitationIdSchema = z.string().uuid().brand("invitationId");
export type InvitationId = z.infer<typeof invitationIdSchema>;

export const invitationStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
]);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

export const invitationSchema = z.object({
  id: invitationIdSchema,
  teamId: teamIdSchema,
  invitedEmail: z.string().email(),
  invitedById: userIdSchema,
  role: teamRoleSchema,
  status: invitationStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Invitation = z.infer<typeof invitationSchema>;

export const invitationWithTeamSchema = z.object({
  id: invitationIdSchema,
  teamId: teamIdSchema,
  invitedEmail: z.string().email(),
  invitedById: userIdSchema,
  role: teamRoleSchema,
  status: invitationStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  team: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
  invitedBy: z.object({
    displayName: z.string(),
    email: z.string().email(),
  }),
});
export type InvitationWithTeam = z.infer<typeof invitationWithTeamSchema>;

export const createInvitationParamsSchema = z.object({
  teamId: teamIdSchema,
  invitedEmail: z.string().email(),
  invitedById: userIdSchema,
  role: teamRoleSchema,
});
export type CreateInvitationParams = z.infer<
  typeof createInvitationParamsSchema
>;

export const listTeamQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      name: z.string().optional(),
      userId: userIdSchema.optional(),
    })
    .optional(),
});
export type ListTeamQuery = z.infer<typeof listTeamQuerySchema>;

export const listTeamMemberQuerySchema = z.object({
  pagination: paginationSchema,
  teamId: teamIdSchema,
  filter: z
    .object({
      role: teamRoleSchema.optional(),
    })
    .optional(),
});
export type ListTeamMemberQuery = z.infer<typeof listTeamMemberQuerySchema>;

export const listInvitationQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      teamId: teamIdSchema.optional(),
      invitedEmail: z.string().email().optional(),
      status: invitationStatusSchema.optional(),
    })
    .optional(),
});
export type ListInvitationQuery = z.infer<typeof listInvitationQuerySchema>;
