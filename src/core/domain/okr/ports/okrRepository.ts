import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type { TeamId } from "../../team/types";
import type { UserId } from "../../user/types";
import type {
  CreateOkrParams,
  ListOkrQuery,
  Okr,
  OkrId,
  OkrWithKeyResults,
  Quarter,
  UpdateOkrParams,
} from "../types";

export interface SearchOkrResult extends Omit<Okr, "keyResults"> {
  teamName: string;
  ownerName: string;
  progress: number;
  keyResults?: Array<{
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
  }>;
}

export interface OkrRepository {
  create(params: CreateOkrParams): Promise<Result<Okr, RepositoryError>>;
  getById(
    id: OkrId,
  ): Promise<Result<OkrWithKeyResults | null, RepositoryError>>;
  update(
    id: OkrId,
    params: UpdateOkrParams,
  ): Promise<Result<Okr, RepositoryError>>;
  delete(id: OkrId): Promise<Result<void, RepositoryError>>;
  list(
    query: ListOkrQuery,
  ): Promise<
    Result<{ items: OkrWithKeyResults[]; count: number }, RepositoryError>
  >;
  listByTeam(
    teamId: TeamId,
    quarter?: Quarter,
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>>;
  listByUser(
    userId: UserId,
    quarter?: Quarter,
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>>;
  listByUserId(
    userId: UserId,
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>>;
  listByTeams(
    teamIds: TeamId[],
  ): Promise<Result<OkrWithKeyResults[], RepositoryError>>;
  countByTeam(teamId: TeamId): Promise<Result<number, RepositoryError>>;
  search(params: {
    query: string;
    teamId?: TeamId;
    userId?: UserId;
    quarter?: string;
    year?: number;
    pagination: { page: number; limit: number };
  }): Promise<
    Result<{ items: SearchOkrResult[]; totalCount: number }, RepositoryError>
  >;
}
