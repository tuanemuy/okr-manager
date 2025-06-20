import type { OkrRepository } from "@/core/domain/okr/ports/okrRepository";
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
import { and, eq, inArray, sql } from "drizzle-orm";
import { type Result, err, ok } from "neverthrow";
import type { Database } from "./client";
import { keyResults, okrs, users } from "./schema";

export class DrizzleSqliteOkrRepository implements OkrRepository {
  constructor(private readonly db: Database) {}

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
        return {
          ...okr,
          keyResults: allKeyResults.filter((kr) => kr.okrId === okr.id),
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
        return {
          ...okr,
          keyResults: allKeyResults.filter((kr) => kr.okrId === okr.id),
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
        return {
          ...okr,
          keyResults: allKeyResults.filter((kr) => kr.okrId === okr.id),
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
}
