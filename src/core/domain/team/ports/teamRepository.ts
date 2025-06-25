import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type { UserId } from "../../user/types";
import type {
  CreateTeamParams,
  ListTeamQuery,
  Team,
  TeamId,
  UpdateTeamParams,
} from "../types";

export interface TeamRepository {
  create(params: CreateTeamParams): Promise<Result<Team, RepositoryError>>;
  getById(id: TeamId): Promise<Result<Team | null, RepositoryError>>;
  update(
    id: TeamId,
    params: UpdateTeamParams,
  ): Promise<Result<Team, RepositoryError>>;
  delete(id: TeamId): Promise<Result<void, RepositoryError>>;
  list(
    query: ListTeamQuery,
  ): Promise<Result<{ items: Team[]; count: number }, RepositoryError>>;
  listByUserId(userId: UserId): Promise<Result<Team[], RepositoryError>>;
  getTeamMembers(teamId: TeamId): Promise<Result<UserId[], RepositoryError>>;
  getBatchTeamMemberCounts(
    teamIds: TeamId[],
  ): Promise<Result<Record<string, number>, RepositoryError>>;
}
