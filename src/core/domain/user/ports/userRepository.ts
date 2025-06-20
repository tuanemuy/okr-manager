import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateUserParams,
  ListUserQuery,
  UpdateUserParams,
  User,
  UserId,
} from "../types";

export interface UserRepository {
  create(params: CreateUserParams): Promise<Result<User, RepositoryError>>;
  getById(id: UserId): Promise<Result<User | null, RepositoryError>>;
  getByEmail(email: string): Promise<Result<User | null, RepositoryError>>;
  update(
    id: UserId,
    params: UpdateUserParams,
  ): Promise<Result<User, RepositoryError>>;
  delete(id: UserId): Promise<Result<void, RepositoryError>>;
  list(
    query: ListUserQuery,
  ): Promise<Result<{ items: User[]; count: number }, RepositoryError>>;
}
