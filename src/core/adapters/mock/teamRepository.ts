import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import type { TeamRepository } from "@/core/domain/team/ports/teamRepository";
import type {
  CreateTeamParams,
  ListTeamQuery,
  Team,
  TeamId,
  UpdateTeamParams,
} from "@/core/domain/team/types";
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";

export class MockTeamRepository implements TeamRepository {
  private teams: Map<TeamId, Team> = new Map();
  private teamsByUser: Map<UserId, TeamId[]> = new Map();
  private shouldFailCreate = false;
  private shouldFailFindById = false;
  private shouldFailUpdate = false;
  private shouldFailDelete = false;
  private shouldFailList = false;
  private shouldFailListByUserId = false;
  private createErrorMessage = "Failed to create team";
  private findByIdErrorMessage = "Failed to find team by ID";
  private updateErrorMessage = "Failed to update team";
  private deleteErrorMessage = "Failed to delete team";
  private listErrorMessage = "Failed to list teams";
  private listByUserIdErrorMessage = "Failed to list teams by user ID";

  async create(
    params: CreateTeamParams,
  ): Promise<Result<Team, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError(this.createErrorMessage));
    }

    const id = uuidv7() as TeamId;
    const team: Team = {
      id,
      name: params.name,
      description: params.description,
      reviewFrequency: params.reviewFrequency,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.teams.set(id, team);

    // Add to user's teams
    const userTeams = this.teamsByUser.get(params.creatorId) || [];
    userTeams.push(id);
    this.teamsByUser.set(params.creatorId, userTeams);

    return ok(team);
  }

  async getById(id: TeamId): Promise<Result<Team | null, RepositoryError>> {
    if (this.shouldFailFindById) {
      return err(new RepositoryError(this.findByIdErrorMessage));
    }

    const team = this.teams.get(id) || null;
    return ok(team);
  }

  async update(
    id: TeamId,
    params: UpdateTeamParams,
  ): Promise<Result<Team, RepositoryError>> {
    if (this.shouldFailUpdate) {
      return err(new RepositoryError(this.updateErrorMessage));
    }

    const team = this.teams.get(id);
    if (!team) {
      return err(new RepositoryError("Team not found"));
    }

    const updatedTeam: Team = {
      ...team,
      ...params,
      updatedAt: new Date(),
    };

    this.teams.set(id, updatedTeam);
    return ok(updatedTeam);
  }

  async delete(id: TeamId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDelete) {
      return err(new RepositoryError(this.deleteErrorMessage));
    }

    const team = this.teams.get(id);
    if (!team) {
      return err(new RepositoryError("Team not found"));
    }

    this.teams.delete(id);

    // Remove from all user team lists
    for (const [userId, teamIds] of this.teamsByUser.entries()) {
      const filteredTeamIds = teamIds.filter((teamId) => teamId !== id);
      if (filteredTeamIds.length === 0) {
        this.teamsByUser.delete(userId);
      } else {
        this.teamsByUser.set(userId, filteredTeamIds);
      }
    }

    return ok(undefined);
  }

  async list(
    query: ListTeamQuery,
  ): Promise<Result<{ items: Team[]; count: number }, RepositoryError>> {
    if (this.shouldFailList) {
      return err(new RepositoryError(this.listErrorMessage));
    }

    const teams = Array.from(this.teams.values());

    // Apply filters
    let filteredTeams = teams;
    if (query.filter?.name) {
      filteredTeams = filteredTeams.filter((team) =>
        team.name
          .toLowerCase()
          .includes(query.filter?.name?.toLowerCase() || ""),
      );
    }
    if (query.filter?.userId) {
      const userTeamIds = this.teamsByUser.get(query.filter.userId) || [];
      filteredTeams = filteredTeams.filter((team) =>
        userTeamIds.includes(team.id),
      );
    }

    // Apply pagination
    const offset = (query.pagination.page - 1) * query.pagination.limit;
    const paginatedTeams = filteredTeams.slice(
      offset,
      offset + query.pagination.limit,
    );

    return ok({
      items: paginatedTeams,
      count: filteredTeams.length,
    });
  }

  async listByUserId(userId: UserId): Promise<Result<Team[], RepositoryError>> {
    if (this.shouldFailListByUserId) {
      return err(new RepositoryError(this.listByUserIdErrorMessage));
    }

    const userTeamIds = this.teamsByUser.get(userId) || [];
    const teams = userTeamIds
      .map((id) => this.teams.get(id))
      .filter((team): team is Team => team !== undefined);

    return ok(teams);
  }

  async getTeamMembers(
    teamId: TeamId,
  ): Promise<Result<UserId[], RepositoryError>> {
    const members: UserId[] = [];
    for (const [userId, teamIds] of this.teamsByUser.entries()) {
      if (teamIds.includes(teamId)) {
        members.push(userId);
      }
    }
    return ok(members);
  }

  async getBatchTeamMemberCounts(
    teamIds: TeamId[],
  ): Promise<Result<Record<string, number>, RepositoryError>> {
    const counts: Record<string, number> = {};
    for (const teamId of teamIds) {
      let count = 0;
      for (const [, userTeamIds] of this.teamsByUser.entries()) {
        if (userTeamIds.includes(teamId)) {
          count++;
        }
      }
      counts[teamId] = count;
    }
    return ok(counts);
  }

  // Helper methods for testing
  clear(): void {
    this.teams.clear();
    this.teamsByUser.clear();
    this.shouldFailCreate = false;
    this.shouldFailFindById = false;
    this.shouldFailUpdate = false;
    this.shouldFailDelete = false;
    this.shouldFailList = false;
    this.shouldFailListByUserId = false;
  }

  seed(teams: Team[], userTeamMapping?: Map<UserId, TeamId[]>): void {
    this.clear();
    for (const team of teams) {
      this.teams.set(team.id, team);
    }
    if (userTeamMapping) {
      this.teamsByUser = new Map(userTeamMapping);
    }
  }

  addUserToTeam(userId: UserId, teamId: TeamId): void {
    const userTeams = this.teamsByUser.get(userId) || [];
    if (!userTeams.includes(teamId)) {
      userTeams.push(teamId);
      this.teamsByUser.set(userId, userTeams);
    }
  }

  setShouldFailCreate(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailCreate = shouldFail;
    if (errorMessage) {
      this.createErrorMessage = errorMessage;
    }
  }

  setShouldFailFindById(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailFindById = shouldFail;
    if (errorMessage) {
      this.findByIdErrorMessage = errorMessage;
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

  setShouldFailListByUserId(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailListByUserId = shouldFail;
    if (errorMessage) {
      this.listByUserIdErrorMessage = errorMessage;
    }
  }
}
