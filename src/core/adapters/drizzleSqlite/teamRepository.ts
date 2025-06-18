import type { TeamRepository } from "@/core/domain/team/ports/teamRepository";
import type {
  CreateTeamParams,
  ListTeamQuery,
  Team,
  TeamId,
  UpdateTeamParams,
} from "@/core/domain/team/types";
import { teamSchema } from "@/core/domain/team/types";
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { and, eq, sql } from "drizzle-orm";
import { type Result, err, ok } from "neverthrow";
import type { Database } from "./client";
import { teamMembers, teams } from "./schema";

export class DrizzleSqliteTeamRepository implements TeamRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateTeamParams,
  ): Promise<Result<Team, RepositoryError>> {
    try {
      const result = await this.db.insert(teams).values(params).returning();

      const team = result[0];
      if (!team) {
        return err(new RepositoryError("Failed to create team"));
      }

      return validate(teamSchema, team).mapErr((error) => {
        return new RepositoryError("Invalid team data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create team", error));
    }
  }

  async findById(id: TeamId): Promise<Result<Team | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(teams)
        .where(eq(teams.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const team = result[0];
      return validate(teamSchema, team)
        .map((validTeam) => validTeam)
        .mapErr((error) => {
          return new RepositoryError("Invalid team data", error);
        });
    } catch (error) {
      return err(new RepositoryError("Failed to find team", error));
    }
  }

  async list(
    query: ListTeamQuery,
  ): Promise<Result<{ items: Team[]; count: number }, RepositoryError>> {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.name ? eq(teams.name, filter.name) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(teams)
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(teams)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(teamSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list teams", error));
    }
  }

  async update(
    id: TeamId,
    params: UpdateTeamParams,
  ): Promise<Result<Team, RepositoryError>> {
    try {
      const result = await this.db
        .update(teams)
        .set(params)
        .where(eq(teams.id, id))
        .returning();

      const team = result[0];
      if (!team) {
        return err(new RepositoryError("Team not found"));
      }

      return validate(teamSchema, team).mapErr((error) => {
        return new RepositoryError("Invalid team data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update team", error));
    }
  }

  async delete(id: TeamId): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(teams)
        .where(eq(teams.id, id))
        .returning();

      if (result.length === 0) {
        return err(new RepositoryError("Team not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete team", error));
    }
  }

  async listByUserId(userId: UserId): Promise<Result<Team[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
        })
        .from(teams)
        .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
        .where(eq(teamMembers.userId, userId));

      return ok(
        result
          .map((item) => validate(teamSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to list teams by user ID", error));
    }
  }
}
