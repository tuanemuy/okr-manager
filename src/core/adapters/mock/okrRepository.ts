import type { OkrRepository } from "@/core/domain/okr/ports/okrRepository";
import type {
  CreateOkrParams,
  KeyResult,
  ListOkrQuery,
  Okr,
  OkrId,
  OkrWithKeyResults,
  Quarter,
  UpdateOkrParams,
} from "@/core/domain/okr/types";
import type { TeamId } from "@/core/domain/team/types";
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";
import { type Result, err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

export class MockOkrRepository implements OkrRepository {
  private okrs: Map<OkrId, Okr> = new Map();
  private keyResults: Map<OkrId, KeyResult[]> = new Map();
  private userProfiles: Map<UserId, { displayName: string; email: string }> = new Map();
  private shouldFailCreate = false;
  private shouldFailGetById = false;
  private shouldFailUpdate = false;
  private shouldFailDelete = false;
  private shouldFailList = false;
  private shouldFailListByTeam = false;
  private shouldFailListByUser = false;
  private shouldFailCountByTeam = false;
  private createErrorMessage = "Failed to create OKR";
  private getByIdErrorMessage = "Failed to get OKR by ID";
  private updateErrorMessage = "Failed to update OKR";
  private deleteErrorMessage = "Failed to delete OKR";
  private listErrorMessage = "Failed to list OKRs";
  private listByTeamErrorMessage = "Failed to list OKRs by team";
  private listByUserErrorMessage = "Failed to list OKRs by user";
  private countByTeamErrorMessage = "Failed to count OKRs by team";

  async create(params: CreateOkrParams): Promise<Result<Okr, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError(this.createErrorMessage));
    }

    const id = uuidv7() as OkrId;
    const okr: Okr = {
      id,
      title: params.title,
      description: params.description,
      type: params.type,
      teamId: params.teamId,
      ownerId: params.ownerId,
      quarterYear: params.quarterYear,
      quarterQuarter: params.quarterQuarter,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.okrs.set(id, okr);
    this.keyResults.set(id, []); // Initialize empty key results array

    return ok(okr);
  }

  async getById(id: OkrId): Promise<Result<OkrWithKeyResults | null, RepositoryError>> {
    if (this.shouldFailGetById) {
      return err(new RepositoryError(this.getByIdErrorMessage));
    }

    const okr = this.okrs.get(id);
    if (!okr) {
      return ok(null);
    }

    const keyResults = this.keyResults.get(id) || [];
    const ownerProfile = okr.ownerId ? this.userProfiles.get(okr.ownerId) : undefined;

    const okrWithKeyResults: OkrWithKeyResults = {
      ...okr,
      keyResults,
      owner: ownerProfile,
    };

    return ok(okrWithKeyResults);
  }

  async update(
    id: OkrId,
    params: UpdateOkrParams,
  ): Promise<Result<Okr, RepositoryError>> {
    if (this.shouldFailUpdate) {
      return err(new RepositoryError(this.updateErrorMessage));
    }

    const okr = this.okrs.get(id);
    if (!okr) {
      return err(new RepositoryError("OKR not found"));
    }

    const updatedOkr: Okr = {
      ...okr,
      ...params,
      updatedAt: new Date(),
    };

    this.okrs.set(id, updatedOkr);
    return ok(updatedOkr);
  }

  async delete(id: OkrId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDelete) {
      return err(new RepositoryError(this.deleteErrorMessage));
    }

    if (!this.okrs.has(id)) {
      return err(new RepositoryError("OKR not found"));
    }

    this.okrs.delete(id);
    this.keyResults.delete(id);

    return ok(undefined);
  }

  async list(
    query: ListOkrQuery,
  ): Promise<Result<{ items: OkrWithKeyResults[]; count: number }, RepositoryError>> {
    if (this.shouldFailList) {
      return err(new RepositoryError(this.listErrorMessage));
    }

    const okrs = Array.from(this.okrs.values());

    // Apply filters
    let filteredOkrs = okrs;
    if (query.filter?.teamId) {
      filteredOkrs = filteredOkrs.filter((okr) => okr.teamId === query.filter?.teamId);
    }
    if (query.filter?.ownerId) {
      filteredOkrs = filteredOkrs.filter((okr) => okr.ownerId === query.filter?.ownerId);
    }
    if (query.filter?.type) {
      filteredOkrs = filteredOkrs.filter((okr) => okr.type === query.filter?.type);
    }
    if (query.filter?.year) {
      filteredOkrs = filteredOkrs.filter((okr) => okr.quarterYear === query.filter?.year);
    }
    if (query.filter?.quarter) {
      filteredOkrs = filteredOkrs.filter((okr) => okr.quarterQuarter === query.filter?.quarter);
    }
    if (query.filter?.title) {
      filteredOkrs = filteredOkrs.filter((okr) =>
        okr.title.toLowerCase().includes(query.filter?.title?.toLowerCase() || ""),
      );
    }

    // Convert to OkrWithKeyResults
    const okrsWithKeyResults: OkrWithKeyResults[] = filteredOkrs.map((okr) => {
      const keyResults = this.keyResults.get(okr.id) || [];
      const ownerProfile = okr.ownerId ? this.userProfiles.get(okr.ownerId) : undefined;

      return {
        ...okr,
        keyResults,
        owner: ownerProfile,
      };
    });

    // Apply pagination
    const offset = (query.pagination.page - 1) * query.pagination.limit;
    const paginatedOkrs = okrsWithKeyResults.slice(
      offset,
      offset + query.pagination.limit,
    );

    return ok({
      items: paginatedOkrs,
      count: filteredOkrs.length,
    });
  }

  async listByTeam(
    teamId: TeamId,
    quarter?: Quarter,
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>> {
    if (this.shouldFailListByTeam) {
      return err(new RepositoryError(this.listByTeamErrorMessage));
    }

    const okrs = Array.from(this.okrs.values()).filter((okr) => {
      if (okr.teamId !== teamId) return false;
      if (quarter) {
        return okr.quarterYear === quarter.year && okr.quarterQuarter === quarter.quarter;
      }
      return true;
    });

    const okrsWithKeyResults: OkrWithKeyResults[] = okrs.map((okr) => {
      const keyResults = this.keyResults.get(okr.id) || [];
      const ownerProfile = okr.ownerId ? this.userProfiles.get(okr.ownerId) : undefined;

      return {
        ...okr,
        keyResults,
        owner: ownerProfile,
      };
    });

    return ok(okrsWithKeyResults);
  }

  async listByUser(
    userId: UserId,
    quarter?: Quarter,
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>> {
    if (this.shouldFailListByUser) {
      return err(new RepositoryError(this.listByUserErrorMessage));
    }

    const okrs = Array.from(this.okrs.values()).filter((okr) => {
      if (okr.ownerId !== userId) return false;
      if (quarter) {
        return okr.quarterYear === quarter.year && okr.quarterQuarter === quarter.quarter;
      }
      return true;
    });

    const okrsWithKeyResults: OkrWithKeyResults[] = okrs.map((okr) => {
      const keyResults = this.keyResults.get(okr.id) || [];
      const ownerProfile = okr.ownerId ? this.userProfiles.get(okr.ownerId) : undefined;

      return {
        ...okr,
        keyResults,
        owner: ownerProfile,
      };
    });

    return ok(okrsWithKeyResults);
  }

  async countByTeam(teamId: TeamId): Promise<Result<number, RepositoryError>> {
    if (this.shouldFailCountByTeam) {
      return err(new RepositoryError(this.countByTeamErrorMessage));
    }

    const count = Array.from(this.okrs.values()).filter(
      (okr) => okr.teamId === teamId,
    ).length;

    return ok(count);
  }

  // Helper methods for testing
  clear(): void {
    this.okrs.clear();
    this.keyResults.clear();
    this.userProfiles.clear();
    this.shouldFailCreate = false;
    this.shouldFailGetById = false;
    this.shouldFailUpdate = false;
    this.shouldFailDelete = false;
    this.shouldFailList = false;
    this.shouldFailListByTeam = false;
    this.shouldFailListByUser = false;
    this.shouldFailCountByTeam = false;
  }

  seed(okrs: Okr[], keyResultsMap?: Map<OkrId, KeyResult[]>): void {
    this.clear();
    for (const okr of okrs) {
      this.okrs.set(okr.id, okr);
      this.keyResults.set(okr.id, keyResultsMap?.get(okr.id) || []);
    }
  }

  setKeyResults(okrId: OkrId, keyResults: KeyResult[]): void {
    this.keyResults.set(okrId, keyResults);
  }

  setUserProfile(
    userId: UserId,
    profile: { displayName: string; email: string },
  ): void {
    this.userProfiles.set(userId, profile);
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

  setShouldFailListByTeam(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailListByTeam = shouldFail;
    if (errorMessage) {
      this.listByTeamErrorMessage = errorMessage;
    }
  }

  setShouldFailListByUser(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailListByUser = shouldFail;
    if (errorMessage) {
      this.listByUserErrorMessage = errorMessage;
    }
  }

  setShouldFailCountByTeam(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailCountByTeam = shouldFail;
    if (errorMessage) {
      this.countByTeamErrorMessage = errorMessage;
    }
  }
}