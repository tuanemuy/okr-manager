import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type {
  OkrRepository,
  SearchOkrResult,
} from "@/core/domain/okr/ports/okrRepository";
import type {
  CreateOkrParams,
  ListOkrQuery,
  Okr,
  OkrId,
  OkrWithKeyResults,
  Quarter,
  UpdateOkrParams,
} from "@/core/domain/okr/types";
import { okrSchema, okrWithKeyResultsSchema } from "@/core/domain/okr/types";
import type { TeamId } from "@/core/domain/team/types";
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { keyResults, okrs, teams, users } from "./schema";

export class DrizzleSqliteOkrRepository implements OkrRepository {
  constructor(private readonly db: Database) {}

  private calculateProgress(
    keyResults: { currentValue: number; targetValue: number }[],
  ): number {
    if (keyResults.length === 0) return 0;

    const totalProgress = keyResults.reduce((sum, kr) => {
      const krProgress =
        kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
      return sum + Math.min(krProgress, 100);
    }, 0);

    return Math.round(totalProgress / keyResults.length);
  }

  async create(params: CreateOkrParams): Promise<Result<Okr, RepositoryError>> {
    try {
      const result = await this.db.insert(okrs).values(params).returning();

      const okr = result[0];
      if (!okr) {
        return err(new RepositoryError("Failed to create OKR"));
      }

      return validate(okrSchema, okr).mapErr((error) => {
        return new RepositoryError("Invalid OKR data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create OKR", error));
    }
  }

  async getById(
    id: OkrId,
  ): Promise<Result<OkrWithKeyResults | null, RepositoryError>> {
    try {
      const [okrResult, keyResultsResult, ownerResult] = await Promise.all([
        this.db.select().from(okrs).where(eq(okrs.id, id)).limit(1),
        this.db.select().from(keyResults).where(eq(keyResults.okrId, id)),
        this.db
          .select({
            displayName: users.displayName,
            email: users.email,
          })
          .from(users)
          .innerJoin(okrs, eq(users.id, okrs.ownerId))
          .where(eq(okrs.id, id))
          .limit(1),
      ]);

      if (okrResult.length === 0) {
        return ok(null);
      }

      const okr = okrResult[0];
      const okrWithKeyResults = {
        ...okr,
        keyResults: keyResultsResult,
        owner: ownerResult.length > 0 ? ownerResult[0] : undefined,
      };

      return validate(okrWithKeyResultsSchema, okrWithKeyResults)
        .map((validOkr) => validOkr)
        .mapErr((error) => {
          return new RepositoryError("Invalid OKR data", error);
        });
    } catch (error) {
      return err(new RepositoryError("Failed to find OKR", error));
    }
  }

  async list(
    query: ListOkrQuery,
  ): Promise<
    Result<{ items: OkrWithKeyResults[]; count: number }, RepositoryError>
  > {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.teamId ? eq(okrs.teamId, filter.teamId) : undefined,
      filter?.ownerId ? eq(okrs.ownerId, filter.ownerId) : undefined,
      filter?.type ? eq(okrs.type, filter.type) : undefined,
      filter?.quarter ? eq(okrs.quarterQuarter, filter.quarter) : undefined,
      filter?.year ? eq(okrs.quarterYear, filter.year) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(okrs)
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(okrs)
          .where(and(...filters)),
      ]);

      // Get key results and owners for each OKR
      const okrIds = items.map((item) => item.id);
      const [allKeyResults, allOwners] = await Promise.all([
        okrIds.length > 0
          ? this.db
              .select()
              .from(keyResults)
              .where(inArray(keyResults.okrId, okrIds))
          : [],
        okrIds.length > 0
          ? this.db
              .select({
                okrId: okrs.id,
                displayName: users.displayName,
                email: users.email,
              })
              .from(users)
              .innerJoin(okrs, eq(users.id, okrs.ownerId))
              .where(inArray(okrs.id, okrIds))
          : [],
      ]);

      const okrsWithKeyResults = items.map((okr) => {
        const owner = allOwners.find((owner) => owner.okrId === okr.id);
        const keyResultsForOkr = allKeyResults.filter(
          (kr) => kr.okrId === okr.id,
        );
        return {
          ...okr,
          keyResults: keyResultsForOkr,
          progress: this.calculateProgress(keyResultsForOkr),
          owner: owner
            ? {
                displayName: owner.displayName,
                email: owner.email,
              }
            : undefined,
        };
      });

      return ok({
        items: okrsWithKeyResults
          .map((item) => validate(okrWithKeyResultsSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list OKRs", error));
    }
  }

  async update(
    id: OkrId,
    params: UpdateOkrParams,
  ): Promise<Result<Okr, RepositoryError>> {
    try {
      const result = await this.db
        .update(okrs)
        .set(params)
        .where(eq(okrs.id, id))
        .returning();

      const okr = result[0];
      if (!okr) {
        return err(new RepositoryError("OKR not found"));
      }

      return validate(okrSchema, okr).mapErr((error) => {
        return new RepositoryError("Invalid OKR data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update OKR", error));
    }
  }

  async delete(id: OkrId): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(okrs)
        .where(eq(okrs.id, id))
        .returning();

      if (result.length === 0) {
        return err(new RepositoryError("OKR not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete OKR", error));
    }
  }

  async listByTeam(
    teamId: TeamId,
    quarter?: Quarter,
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>> {
    try {
      const filters = [
        eq(okrs.teamId, teamId),
        quarter ? eq(okrs.quarterYear, quarter.year) : undefined,
        quarter ? eq(okrs.quarterQuarter, quarter.quarter) : undefined,
      ].filter((filter) => filter !== undefined);

      const items = await this.db
        .select()
        .from(okrs)
        .where(and(...filters));

      // Get key results and owners for each OKR
      const okrIds = items.map((item) => item.id);
      const [allKeyResults, allOwners] = await Promise.all([
        okrIds.length > 0
          ? this.db
              .select()
              .from(keyResults)
              .where(inArray(keyResults.okrId, okrIds))
          : [],
        okrIds.length > 0
          ? this.db
              .select({
                okrId: okrs.id,
                displayName: users.displayName,
                email: users.email,
              })
              .from(users)
              .innerJoin(okrs, eq(users.id, okrs.ownerId))
              .where(inArray(okrs.id, okrIds))
          : [],
      ]);

      const okrsWithKeyResults = items.map((okr) => {
        const owner = allOwners.find((owner) => owner.okrId === okr.id);
        const keyResultsForOkr = allKeyResults.filter(
          (kr) => kr.okrId === okr.id,
        );
        return {
          ...okr,
          keyResults: keyResultsForOkr,
          progress: this.calculateProgress(keyResultsForOkr),
          owner: owner
            ? {
                displayName: owner.displayName,
                email: owner.email,
              }
            : undefined,
        };
      });

      return ok(
        okrsWithKeyResults
          .map((item) => validate(okrWithKeyResultsSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to list OKRs by team", error));
    }
  }

  async listByUser(
    userId: UserId,
    quarter?: Quarter,
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>> {
    try {
      const filters = [
        eq(okrs.ownerId, userId),
        quarter ? eq(okrs.quarterYear, quarter.year) : undefined,
        quarter ? eq(okrs.quarterQuarter, quarter.quarter) : undefined,
      ].filter((filter) => filter !== undefined);

      const items = await this.db
        .select()
        .from(okrs)
        .where(and(...filters));

      // Get key results and owners for each OKR
      const okrIds = items.map((item) => item.id);
      const [allKeyResults, allOwners] = await Promise.all([
        okrIds.length > 0
          ? this.db
              .select()
              .from(keyResults)
              .where(inArray(keyResults.okrId, okrIds))
          : [],
        okrIds.length > 0
          ? this.db
              .select({
                okrId: okrs.id,
                displayName: users.displayName,
                email: users.email,
              })
              .from(users)
              .innerJoin(okrs, eq(users.id, okrs.ownerId))
              .where(inArray(okrs.id, okrIds))
          : [],
      ]);

      const okrsWithKeyResults = items.map((okr) => {
        const owner = allOwners.find((owner) => owner.okrId === okr.id);
        const keyResultsForOkr = allKeyResults.filter(
          (kr) => kr.okrId === okr.id,
        );
        return {
          ...okr,
          keyResults: keyResultsForOkr,
          progress: this.calculateProgress(keyResultsForOkr),
          owner: owner
            ? {
                displayName: owner.displayName,
                email: owner.email,
              }
            : undefined,
        };
      });

      return ok(
        okrsWithKeyResults
          .map((item) => validate(okrWithKeyResultsSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to list OKRs by user", error));
    }
  }

  async countByTeam(teamId: TeamId): Promise<Result<number, RepositoryError>> {
    try {
      const result = await this.db
        .select({ count: sql`count(*)` })
        .from(okrs)
        .where(eq(okrs.teamId, teamId));

      return ok(Number(result[0]?.count || 0));
    } catch (error) {
      return err(new RepositoryError("Failed to count OKRs by team", error));
    }
  }

  async listByUserId(
    userId: UserId,
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>> {
    return this.listByUser(userId);
  }

  async listByTeams(
    teamIds: TeamId[],
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>> {
    try {
      if (teamIds.length === 0) {
        return ok([]);
      }

      const okrResults = await this.db
        .select()
        .from(okrs)
        .where(sql`${okrs.teamId} IN (${teamIds.map(() => "?").join(",")})`)
        .orderBy(okrs.createdAt);

      if (okrResults.length === 0) {
        return ok([]);
      }

      const okrIds = okrResults.map((okr) => okr.id);
      const [allKeyResults, allOwners] = await Promise.all([
        this.db
          .select()
          .from(keyResults)
          .where(
            sql`${keyResults.okrId} IN (${okrIds.map(() => "?").join(",")})`,
          ),
        this.db
          .select({
            okrId: okrs.id,
            displayName: users.displayName,
            email: users.email,
          })
          .from(okrs)
          .leftJoin(users, eq(okrs.ownerId, users.id))
          .where(sql`${okrs.id} IN (${okrIds.map(() => "?").join(",")})`),
      ]);

      const okrsWithKeyResults = okrResults.map((okr) => {
        const owner = allOwners.find((owner) => owner.okrId === okr.id);
        const keyResultsForOkr = allKeyResults.filter(
          (kr) => kr.okrId === okr.id,
        );
        return {
          ...okr,
          keyResults: keyResultsForOkr,
          progress: this.calculateProgress(keyResultsForOkr),
          owner: owner
            ? {
                displayName: owner.displayName,
                email: owner.email,
              }
            : undefined,
        };
      });

      return ok(
        okrsWithKeyResults
          .map((item) => validate(okrWithKeyResultsSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to list OKRs by teams", error));
    }
  }

  async search(params: {
    query: string;
    teamId?: TeamId;
    userId?: UserId;
    quarter?: string;
    year?: number;
    pagination: { page: number; limit: number };
  }): Promise<
    Result<{ items: SearchOkrResult[]; totalCount: number }, RepositoryError>
  > {
    try {
      const { query, teamId, pagination } = params;
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      const filters = [
        query
          ? or(
              ilike(okrs.title, `%${query}%`),
              ilike(okrs.description, `%${query}%`),
            )
          : undefined,
        teamId ? eq(okrs.teamId, teamId) : undefined,
      ].filter((filter) => filter !== undefined);

      const [items, countResult] = await Promise.all([
        this.db
          .select({
            id: okrs.id,
            title: okrs.title,
            description: okrs.description,
            type: okrs.type,
            teamId: okrs.teamId,
            quarterYear: okrs.quarterYear,
            quarterQuarter: okrs.quarterQuarter,
            createdAt: okrs.createdAt,
            updatedAt: okrs.updatedAt,
            teamName: teams.name,
            ownerName: users.displayName,
          })
          .from(okrs)
          .leftJoin(teams, eq(okrs.teamId, teams.id))
          .leftJoin(users, eq(okrs.ownerId, users.id))
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(okrs)
          .leftJoin(teams, eq(okrs.teamId, teams.id))
          .leftJoin(users, eq(okrs.ownerId, users.id))
          .where(and(...filters)),
      ]);

      // Get key results for progress calculation
      const okrIds = items.map((item) => item.id);
      const keyResultsForSearch =
        okrIds.length > 0
          ? await this.db
              .select()
              .from(keyResults)
              .where(
                sql`${keyResults.okrId} IN (${okrIds.map(() => "?").join(",")})`,
              )
          : [];

      const searchResults: SearchOkrResult[] = items.map((item) => {
        const keyResultsForOkr = keyResultsForSearch.filter(
          (kr) => kr.okrId === item.id,
        );
        return {
          id: item.id as OkrId,
          title: item.title,
          description: item.description || undefined,
          type: item.type,
          teamId: item.teamId as TeamId,
          quarterYear: item.quarterYear,
          quarterQuarter: item.quarterQuarter,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          teamName: item.teamName || "Unknown Team",
          ownerName: item.ownerName || "Unknown Owner",
          progress: this.calculateProgress(keyResultsForOkr),
        };
      });

      return ok({
        items: searchResults,
        totalCount: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to search OKRs", error));
    }
  }
}
