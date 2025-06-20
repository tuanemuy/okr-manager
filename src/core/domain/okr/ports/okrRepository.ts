import type { RepositoryError } from "@/lib/error";
import type { Result } from "neverthrow";
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
  countByTeam(teamId: TeamId): Promise<Result<number, RepositoryError>>;
}
