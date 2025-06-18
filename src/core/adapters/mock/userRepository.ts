import type { UserRepository } from "@/core/domain/user/ports/userRepository";
import type {
  CreateUserParams,
  ListUserQuery,
  UpdateUserParams,
  User,
  UserId,
} from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";
import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

export class MockUserRepository implements UserRepository {
  private users: Map<UserId, User> = new Map();
  private emailIndex: Map<string, UserId> = new Map();

  async create(
    params: CreateUserParams,
  ): Promise<Result<User, RepositoryError>> {
    const id = uuidv7() as UserId;
    const user: User = {
      id,
      email: params.email,
      displayName: params.displayName,
      hashedPassword: params.hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);
    this.emailIndex.set(params.email, id);

    return ok(user);
  }

  async getById(id: UserId): Promise<Result<User | null, RepositoryError>> {
    const user = this.users.get(id) || null;
    return ok(user);
  }

  async getByEmail(
    email: string,
  ): Promise<Result<User | null, RepositoryError>> {
    const userId = this.emailIndex.get(email);
    if (!userId) {
      return ok(null);
    }
    const user = this.users.get(userId) || null;
    return ok(user);
  }

  async update(
    id: UserId,
    params: UpdateUserParams,
  ): Promise<Result<User, RepositoryError>> {
    const user = this.users.get(id);
    if (!user) {
      return err(new RepositoryError("User not found"));
    }

    const updatedUser: User = {
      ...user,
      ...params,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(updatedUser);
  }

  async delete(id: UserId): Promise<Result<void, RepositoryError>> {
    const user = this.users.get(id);
    if (!user) {
      return err(new RepositoryError("User not found"));
    }

    this.users.delete(id);
    this.emailIndex.delete(user.email);
    return ok(undefined);
  }

  async list(
    query: ListUserQuery,
  ): Promise<Result<{ items: User[]; count: number }, RepositoryError>> {
    const users = Array.from(this.users.values());

    // Apply filters
    let filteredUsers = users;
    if (query.filter?.email) {
      filteredUsers = filteredUsers.filter((user) =>
        user.email.includes(query.filter?.email || ""),
      );
    }
    if (query.filter?.displayName) {
      filteredUsers = filteredUsers.filter((user) =>
        user.displayName.includes(query.filter?.displayName || ""),
      );
    }

    // Apply pagination
    const offset = (query.pagination.page - 1) * query.pagination.limit;
    const paginatedUsers = filteredUsers.slice(
      offset,
      offset + query.pagination.limit,
    );

    return ok({
      items: paginatedUsers,
      count: filteredUsers.length,
    });
  }

  // Helper methods for testing
  clear(): void {
    this.users.clear();
    this.emailIndex.clear();
  }

  seed(users: User[]): void {
    this.clear();
    for (const user of users) {
      this.users.set(user.id, user);
      this.emailIndex.set(user.email, user.id);
    }
  }
}
