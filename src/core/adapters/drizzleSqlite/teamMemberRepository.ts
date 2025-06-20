import { and, eq, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { TeamMemberRepository } from "@/core/domain/team/ports/teamMemberRepository";
import type {
  ListTeamMemberQuery,
  TeamId,
  TeamMember,
  TeamMemberWithUser,
  TeamRole,
} from "@/core/domain/team/types";
import {
  teamMemberSchema,
  teamMemberWithUserSchema,
} from "@/core/domain/team/types";
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { teamMembers, users } from "./schema";

export class DrizzleSqliteTeamMemberRepository implements TeamMemberRepository {
  constructor(private readonly db: Database) {}

  async create(
    teamId: TeamId,
    userId: UserId,
    role: TeamRole,
  ): Promise<Result<TeamMember, RepositoryError>> {
    try {
      const result = await this.db
        .insert(teamMembers)
        .values({ teamId, userId, role })
        .returning();

      const teamMember = result[0];
      if (!teamMember) {
        return err(new RepositoryError("Failed to create team member"));
      }

      return validate(teamMemberSchema, teamMember).mapErr((error) => {
        return new RepositoryError("Invalid team member data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create team member", error));
    }
  }

  async getByTeamAndUser(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<TeamMember | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(teamMembers)
        .where(
          and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const teamMember = result[0];
      return validate(teamMemberSchema, teamMember)
        .map((validTeamMember) => validTeamMember)
        .mapErr((error) => {
          return new RepositoryError("Invalid team member data", error);
        });
    } catch (error) {
      return err(new RepositoryError("Failed to find team member", error));
    }
  }

  async list(
    query: ListTeamMemberQuery,
  ): Promise<
    Result<{ items: TeamMemberWithUser[]; count: number }, RepositoryError>
  > {
    const { pagination, teamId, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      eq(teamMembers.teamId, teamId),
      filter?.role ? eq(teamMembers.role, filter.role) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select({
            teamId: teamMembers.teamId,
            userId: teamMembers.userId,
            role: teamMembers.role,
            joinedAt: teamMembers.joinedAt,
            user: {
              displayName: users.displayName,
              email: users.email,
            },
          })
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(teamMembers)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) =>
            validate(teamMemberWithUserSchema, item).unwrapOr(null),
          )
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list team members", error));
    }
  }

  async updateRole(
    teamId: TeamId,
    userId: UserId,
    role: TeamRole,
  ): Promise<Result<TeamMember, RepositoryError>> {
    try {
      const result = await this.db
        .update(teamMembers)
        .set({ role })
        .where(
          and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
        )
        .returning();

      const teamMember = result[0];
      if (!teamMember) {
        return err(new RepositoryError("Team member not found"));
      }

      return validate(teamMemberSchema, teamMember).mapErr((error) => {
        return new RepositoryError("Invalid team member data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update team member", error));
    }
  }

  async delete(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(teamMembers)
        .where(
          and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
        )
        .returning();

      if (result.length === 0) {
        return err(new RepositoryError("Team member not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete team member", error));
    }
  }

  async countByTeam(teamId: TeamId): Promise<Result<number, RepositoryError>> {
    try {
      const result = await this.db
        .select({ count: sql`count(*)` })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId));

      return ok(Number(result[0]?.count || 0));
    } catch (error) {
      return err(new RepositoryError("Failed to count team members", error));
    }
  }

  async isUserInTeam(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const result = await this.db
        .select({ count: sql`count(*)` })
        .from(teamMembers)
        .where(
          and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
        );

      return ok(Number(result[0]?.count || 0) > 0);
    } catch (error) {
      return err(new RepositoryError("Failed to check team membership", error));
    }
  }

  async getUserRole(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<TeamRole | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({ role: teamMembers.role })
        .from(teamMembers)
        .where(
          and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return ok(result[0]?.role as TeamRole);
    } catch (error) {
      return err(new RepositoryError("Failed to get user role", error));
    }
  }
}
