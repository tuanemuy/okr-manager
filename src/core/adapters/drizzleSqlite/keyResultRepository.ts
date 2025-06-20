import { and, eq, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { KeyResultRepository } from "@/core/domain/okr/ports/keyResultRepository";
import type {
  CreateKeyResultParams,
  KeyResult,
  KeyResultId,
  ListKeyResultQuery,
  OkrId,
  UpdateKeyResultParams,
} from "@/core/domain/okr/types";
import { keyResultSchema } from "@/core/domain/okr/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { keyResults } from "./schema";

export class DrizzleSqliteKeyResultRepository implements KeyResultRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateKeyResultParams,
  ): Promise<Result<KeyResult, RepositoryError>> {
    try {
      const result = await this.db
        .insert(keyResults)
        .values(params)
        .returning();

      const keyResult = result[0];
      if (!keyResult) {
        return err(new RepositoryError("Failed to create key result"));
      }

      return validate(keyResultSchema, keyResult).mapErr((error) => {
        return new RepositoryError("Invalid key result data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create key result", error));
    }
  }

  async getById(
    id: KeyResultId,
  ): Promise<Result<KeyResult | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(keyResults)
        .where(eq(keyResults.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const keyResult = result[0];
      return validate(keyResultSchema, keyResult)
        .map((validKeyResult) => validKeyResult)
        .mapErr((error) => {
          return new RepositoryError("Invalid key result data", error);
        });
    } catch (error) {
      return err(new RepositoryError("Failed to find key result", error));
    }
  }

  async list(
    query: ListKeyResultQuery,
  ): Promise<Result<{ items: KeyResult[]; count: number }, RepositoryError>> {
    const { pagination, okrId } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [eq(keyResults.okrId, okrId)].filter(
      (filter) => filter !== undefined,
    );

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(keyResults)
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(keyResults)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(keyResultSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list key results", error));
    }
  }

  async update(
    id: KeyResultId,
    params: UpdateKeyResultParams,
  ): Promise<Result<KeyResult, RepositoryError>> {
    try {
      const result = await this.db
        .update(keyResults)
        .set(params)
        .where(eq(keyResults.id, id))
        .returning();

      const keyResult = result[0];
      if (!keyResult) {
        return err(new RepositoryError("Key result not found"));
      }

      return validate(keyResultSchema, keyResult).mapErr((error) => {
        return new RepositoryError("Invalid key result data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update key result", error));
    }
  }

  async delete(id: KeyResultId): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(keyResults)
        .where(eq(keyResults.id, id))
        .returning();

      if (result.length === 0) {
        return err(new RepositoryError("Key result not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete key result", error));
    }
  }

  async listByOkr(okrId: OkrId): Promise<Result<KeyResult[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(keyResults)
        .where(eq(keyResults.okrId, okrId));

      return ok(
        result
          .map((item) => validate(keyResultSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to list key results by OKR", error),
      );
    }
  }

  async updateProgress(
    id: KeyResultId,
    currentValue: number,
  ): Promise<Result<KeyResult, RepositoryError>> {
    try {
      const result = await this.db
        .update(keyResults)
        .set({ currentValue })
        .where(eq(keyResults.id, id))
        .returning();

      const keyResult = result[0];
      if (!keyResult) {
        return err(new RepositoryError("Key result not found"));
      }

      return validate(keyResultSchema, keyResult).mapErr((error) => {
        return new RepositoryError("Invalid key result data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update key result progress", error),
      );
    }
  }
}
