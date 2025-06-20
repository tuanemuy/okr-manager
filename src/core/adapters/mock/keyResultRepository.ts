import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import type { KeyResultRepository } from "@/core/domain/okr/ports/keyResultRepository";
import type {
  CreateKeyResultParams,
  KeyResult,
  KeyResultId,
  ListKeyResultQuery,
  OkrId,
  UpdateKeyResultParams,
} from "@/core/domain/okr/types";
import { RepositoryError } from "@/lib/error";

export class MockKeyResultRepository implements KeyResultRepository {
  private keyResults: Map<KeyResultId, KeyResult> = new Map();
  private shouldFailCreate = false;
  private shouldFailGetById = false;
  private shouldFailUpdate = false;
  private shouldFailDelete = false;
  private shouldFailList = false;
  private shouldFailListByOkr = false;
  private shouldFailUpdateProgress = false;
  private createErrorMessage = "Failed to create key result";
  private getByIdErrorMessage = "Failed to get key result by ID";
  private updateErrorMessage = "Failed to update key result";
  private deleteErrorMessage = "Failed to delete key result";
  private listErrorMessage = "Failed to list key results";
  private listByOkrErrorMessage = "Failed to list key results by OKR";
  private updateProgressErrorMessage = "Failed to update key result progress";

  async create(
    params: CreateKeyResultParams,
  ): Promise<Result<KeyResult, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError(this.createErrorMessage));
    }

    const id = uuidv7() as KeyResultId;
    const keyResult: KeyResult = {
      id,
      okrId: params.okrId,
      title: params.title,
      targetValue: params.targetValue,
      currentValue: params.currentValue || 0,
      unit: params.unit,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keyResults.set(id, keyResult);
    return ok(keyResult);
  }

  async getById(
    id: KeyResultId,
  ): Promise<Result<KeyResult | null, RepositoryError>> {
    if (this.shouldFailGetById) {
      return err(new RepositoryError(this.getByIdErrorMessage));
    }

    const keyResult = this.keyResults.get(id) || null;
    return ok(keyResult);
  }

  async update(
    id: KeyResultId,
    params: UpdateKeyResultParams,
  ): Promise<Result<KeyResult, RepositoryError>> {
    if (this.shouldFailUpdate) {
      return err(new RepositoryError(this.updateErrorMessage));
    }

    const keyResult = this.keyResults.get(id);
    if (!keyResult) {
      return err(new RepositoryError("Key result not found"));
    }

    const updatedKeyResult: KeyResult = {
      ...keyResult,
      ...params,
      updatedAt: new Date(),
    };

    this.keyResults.set(id, updatedKeyResult);
    return ok(updatedKeyResult);
  }

  async delete(id: KeyResultId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDelete) {
      return err(new RepositoryError(this.deleteErrorMessage));
    }

    if (!this.keyResults.has(id)) {
      return err(new RepositoryError("Key result not found"));
    }

    this.keyResults.delete(id);
    return ok(undefined);
  }

  async list(
    query: ListKeyResultQuery,
  ): Promise<Result<{ items: KeyResult[]; count: number }, RepositoryError>> {
    if (this.shouldFailList) {
      return err(new RepositoryError(this.listErrorMessage));
    }

    const keyResults = Array.from(this.keyResults.values()).filter(
      (kr) => kr.okrId === query.okrId,
    );

    // Apply pagination
    const offset = (query.pagination.page - 1) * query.pagination.limit;
    const paginatedKeyResults = keyResults.slice(
      offset,
      offset + query.pagination.limit,
    );

    return ok({
      items: paginatedKeyResults,
      count: keyResults.length,
    });
  }

  async listByOkr(okrId: OkrId): Promise<Result<KeyResult[], RepositoryError>> {
    if (this.shouldFailListByOkr) {
      return err(new RepositoryError(this.listByOkrErrorMessage));
    }

    const keyResults = Array.from(this.keyResults.values()).filter(
      (kr) => kr.okrId === okrId,
    );

    return ok(keyResults);
  }

  async updateProgress(
    id: KeyResultId,
    currentValue: number,
  ): Promise<Result<KeyResult, RepositoryError>> {
    if (this.shouldFailUpdateProgress) {
      return err(new RepositoryError(this.updateProgressErrorMessage));
    }

    const keyResult = this.keyResults.get(id);
    if (!keyResult) {
      return err(new RepositoryError("Key result not found"));
    }

    const updatedKeyResult: KeyResult = {
      ...keyResult,
      currentValue,
      updatedAt: new Date(),
    };

    this.keyResults.set(id, updatedKeyResult);
    return ok(updatedKeyResult);
  }

  // Helper methods for testing
  clear(): void {
    this.keyResults.clear();
    this.shouldFailCreate = false;
    this.shouldFailGetById = false;
    this.shouldFailUpdate = false;
    this.shouldFailDelete = false;
    this.shouldFailList = false;
    this.shouldFailListByOkr = false;
    this.shouldFailUpdateProgress = false;
  }

  seed(keyResults: KeyResult[]): void {
    this.clear();
    for (const keyResult of keyResults) {
      this.keyResults.set(keyResult.id, keyResult);
    }
  }

  getByOkrId(okrId: OkrId): KeyResult[] {
    return Array.from(this.keyResults.values()).filter(
      (kr) => kr.okrId === okrId,
    );
  }

  setShouldFailCreate(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailCreate = shouldFail;
    if (errorMessage) {
      this.createErrorMessage = errorMessage;
    }
  }

  setShouldFailGetById(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailGetById = shouldFail;
    if (errorMessage) {
      this.getByIdErrorMessage = errorMessage;
    }
  }

  setShouldFailUpdate(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailUpdate = shouldFail;
    if (errorMessage) {
      this.updateErrorMessage = errorMessage;
    }
  }

  setShouldFailDelete(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailDelete = shouldFail;
    if (errorMessage) {
      this.deleteErrorMessage = errorMessage;
    }
  }

  setShouldFailList(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailList = shouldFail;
    if (errorMessage) {
      this.listErrorMessage = errorMessage;
    }
  }

  setShouldFailListByOkr(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailListByOkr = shouldFail;
    if (errorMessage) {
      this.listByOkrErrorMessage = errorMessage;
    }
  }

  setShouldFailUpdateProgress(
    shouldFail: boolean,
    errorMessage?: string,
  ): void {
    this.shouldFailUpdateProgress = shouldFail;
    if (errorMessage) {
      this.updateProgressErrorMessage = errorMessage;
    }
  }
}
