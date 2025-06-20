import type { InvitationRepository } from "@/core/domain/team/ports/invitationRepository";
import type {
  CreateInvitationParams,
  Invitation,
  InvitationId,
  InvitationStatus,
  InvitationWithTeam,
  ListInvitationQuery,
  TeamId,
} from "@/core/domain/team/types";
import {
  invitationSchema,
  invitationWithTeamSchema,
} from "@/core/domain/team/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { and, eq, sql } from "drizzle-orm";
import { type Result, err, ok } from "neverthrow";
import type { Database } from "./client";
import { invitations, teams, users } from "./schema";

export class DrizzleSqliteInvitationRepository implements InvitationRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateInvitationParams,
  ): Promise<Result<Invitation, RepositoryError>> {
    try {
      const result = await this.db
        .insert(invitations)
        .values(params)
        .returning();

      const invitation = result[0];
      if (!invitation) {
        return err(new RepositoryError("Failed to create invitation"));
      }

      return validate(invitationSchema, invitation).mapErr((error) => {
        return new RepositoryError("Invalid invitation data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create invitation", error));
    }
  }

  async getById(
    id: InvitationId,
  ): Promise<Result<InvitationWithTeam | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: invitations.id,
          teamId: invitations.teamId,
          invitedEmail: invitations.invitedEmail,
          invitedById: invitations.invitedById,
          role: invitations.role,
          status: invitations.status,
          createdAt: invitations.createdAt,
          updatedAt: invitations.updatedAt,
          team: {
            name: teams.name,
            description: teams.description,
          },
          invitedBy: {
            displayName: users.displayName,
            email: users.email,
          },
        })
        .from(invitations)
        .innerJoin(teams, eq(invitations.teamId, teams.id))
        .innerJoin(users, eq(invitations.invitedById, users.id))
        .where(eq(invitations.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const invitation = result[0];
      return validate(invitationWithTeamSchema, invitation)
        .map((validInvitation) => validInvitation)
        .mapErr((error) => {
          return new RepositoryError("Invalid invitation data", error);
        });
    } catch (error) {
      return err(new RepositoryError("Failed to find invitation", error));
    }
  }

  async list(
    query: ListInvitationQuery,
  ): Promise<
    Result<{ items: InvitationWithTeam[]; count: number }, RepositoryError>
  > {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.teamId ? eq(invitations.teamId, filter.teamId) : undefined,
      filter?.invitedEmail
        ? eq(invitations.invitedEmail, filter.invitedEmail)
        : undefined,
      filter?.status ? eq(invitations.status, filter.status) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select({
            id: invitations.id,
            teamId: invitations.teamId,
            invitedEmail: invitations.invitedEmail,
            invitedById: invitations.invitedById,
            role: invitations.role,
            status: invitations.status,
            createdAt: invitations.createdAt,
            updatedAt: invitations.updatedAt,
            team: {
              name: teams.name,
              description: teams.description,
            },
            invitedBy: {
              displayName: users.displayName,
              email: users.email,
            },
          })
          .from(invitations)
          .innerJoin(teams, eq(invitations.teamId, teams.id))
          .innerJoin(users, eq(invitations.invitedById, users.id))
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(invitations)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) =>
            validate(invitationWithTeamSchema, item).unwrapOr(null),
          )
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list invitations", error));
    }
  }

  async updateStatus(
    id: InvitationId,
    status: InvitationStatus,
  ): Promise<Result<Invitation, RepositoryError>> {
    try {
      const result = await this.db
        .update(invitations)
        .set({ status })
        .where(eq(invitations.id, id))
        .returning();

      const invitation = result[0];
      if (!invitation) {
        return err(new RepositoryError("Invitation not found"));
      }

      return validate(invitationSchema, invitation).mapErr((error) => {
        return new RepositoryError("Invalid invitation data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update invitation", error));
    }
  }

  async delete(id: InvitationId): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(invitations)
        .where(eq(invitations.id, id))
        .returning();

      if (result.length === 0) {
        return err(new RepositoryError("Invitation not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete invitation", error));
    }
  }

  async listByEmail(
    email: string,
  ): Promise<Result<InvitationWithTeam[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: invitations.id,
          teamId: invitations.teamId,
          invitedEmail: invitations.invitedEmail,
          invitedById: invitations.invitedById,
          role: invitations.role,
          status: invitations.status,
          createdAt: invitations.createdAt,
          updatedAt: invitations.updatedAt,
          team: {
            name: teams.name,
            description: teams.description,
          },
          invitedBy: {
            displayName: users.displayName,
            email: users.email,
          },
        })
        .from(invitations)
        .innerJoin(teams, eq(invitations.teamId, teams.id))
        .innerJoin(users, eq(invitations.invitedById, users.id))
        .where(eq(invitations.invitedEmail, email));

      return ok(
        result
          .map((item) =>
            validate(invitationWithTeamSchema, item).unwrapOr(null),
          )
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to list invitations by email", error),
      );
    }
  }

  async getByTeamAndEmail(
    teamId: TeamId,
    email: string,
  ): Promise<Result<Invitation | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.teamId, teamId),
            eq(invitations.invitedEmail, email),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(invitationSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid invitation data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find invitation", error));
    }
  }
}
