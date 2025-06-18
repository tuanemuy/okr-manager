import type { RepositoryError } from "@/lib/error";
import type { Result } from "neverthrow";
import type { UserId } from "../../user/types";
import type {
  ListTeamMemberQuery,
  TeamId,
  TeamMember,
  TeamMemberWithUser,
  TeamRole,
} from "../types";

export interface TeamMemberRepository {
  create(
    teamId: TeamId,
    userId: UserId,
    role: TeamRole,
  ): Promise<Result<TeamMember, RepositoryError>>;
  getByTeamAndUser(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<TeamMember | null, RepositoryError>>;
  updateRole(
    teamId: TeamId,
    userId: UserId,
    role: TeamRole,
  ): Promise<Result<TeamMember, RepositoryError>>;
  delete(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<void, RepositoryError>>;
  list(
    query: ListTeamMemberQuery,
  ): Promise<
    Result<{ items: TeamMemberWithUser[]; count: number }, RepositoryError>
  >;
  countByTeam(teamId: TeamId): Promise<Result<number, RepositoryError>>;
  isUserInTeam(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<boolean, RepositoryError>>;
  getUserRole(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<TeamRole | null, RepositoryError>>;
}
