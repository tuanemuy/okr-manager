import type { UserRepository } from "@/core/domain/user/ports/userRepository";
import type {
  CreateUserParams,
  ListUserQuery,
  UpdateUserParams,
  User,
  UserId,
} from "@/core/domain/user/types";
import { userSchema } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { and, eq, like, sql } from "drizzle-orm";
import { type Result, err, ok } from "neverthrow";
import type { Database } from "./client";
import { users } from "./schema";

export class DrizzleSqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateUserParams,
  ): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db.insert(users).values(params).returning();

      const user = result[0];
      if (!user) {
        return err(new RepositoryError("Failed to create user"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create user", error));
    }
  }

  async getById(id: UserId): Promise<Result<User | null, RepositoryError>> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id));

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find user by id", error));
    }
  }

  async getByEmail(
    email: string,
  ): Promise<Result<User | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find user by email", error));
    }
  }

  async update(
    id: UserId,
    params: UpdateUserParams,
  ): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db
        .update(users)
        .set(params)
        .where(eq(users.id, id))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new RepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update user", error));
    }
  }

  async delete(id: UserId): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(users).where(eq(users.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete user", error));
    }
  }

  async list(
    query: ListUserQuery,
  ): Promise<Result<{ items: User[]; count: number }, RepositoryError>> {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.email ? eq(users.email, filter.email) : undefined,
      filter?.displayName
        ? like(users.displayName, `%${filter.displayName}%`)
        : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(users)
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(users)
          .where(and(...filters)),
      ]);

      const validatedItems = items
        .map((item) => validate(userSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok({
        items: validatedItems,
        count: Number(countResult[0]?.count ?? 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list users", error));
    }
  }
}
