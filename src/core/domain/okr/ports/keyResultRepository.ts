import type { RepositoryError } from "@/lib/error";
import type { Result } from "neverthrow";
import type {
  CreateKeyResultParams,
  KeyResult,
  KeyResultId,
  ListKeyResultQuery,
  OkrId,
  UpdateKeyResultParams,
} from "../types";

export interface KeyResultRepository {
  create(
    params: CreateKeyResultParams,
  ): Promise<Result<KeyResult, RepositoryError>>;
  getById(id: KeyResultId): Promise<Result<KeyResult | null, RepositoryError>>;
  update(
    id: KeyResultId,
    params: UpdateKeyResultParams,
  ): Promise<Result<KeyResult, RepositoryError>>;
  delete(id: KeyResultId): Promise<Result<void, RepositoryError>>;
  list(
    query: ListKeyResultQuery,
  ): Promise<Result<{ items: KeyResult[]; count: number }, RepositoryError>>;
  listByOkr(okrId: OkrId): Promise<Result<KeyResult[], RepositoryError>>;
  updateProgress(
    id: KeyResultId,
    currentValue: number,
  ): Promise<Result<KeyResult, RepositoryError>>;
}
