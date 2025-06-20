import type { TeamMemberRepository } from "@/core/domain/team/ports/teamMemberRepository";
import type {
  ListTeamMemberQuery,
  TeamId,
  TeamMember,
  TeamMemberWithUser,
  TeamRole,
} from "@/core/domain/team/types";
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";
import { type Result, err, ok } from "neverthrow";

interface TeamMemberKey {
  teamId: TeamId;
  userId: UserId;
}

export class MockTeamMemberRepository implements TeamMemberRepository {
  private members: Map<string, TeamMember> = new Map();
  private userProfiles: Map<UserId, { displayName: string; email: string }> =
    new Map();
  private shouldFailCreate = false;
  private shouldFailGetByTeamAndUser = false;
  private shouldFailUpdateRole = false;
  private shouldFailDelete = false;
  private shouldFailList = false;
  private shouldFailCountByTeam = false;
  private shouldFailIsUserInTeam = false;
  private shouldFailGetUserRole = false;
  private createErrorMessage = "Failed to create team member";
  private getByTeamAndUserErrorMessage = "Failed to get team member";
  private updateRoleErrorMessage = "Failed to update team member role";
  private deleteErrorMessage = "Failed to delete team member";
  private listErrorMessage = "Failed to list team members";
  private countByTeamErrorMessage = "Failed to count team members";
  private isUserInTeamErrorMessage = "Failed to check user team membership";
  private getUserRoleErrorMessage = "Failed to get user role";

  private getKey(teamId: TeamId, userId: UserId): string {
    return `${teamId}:${userId}`;
  }

  async create(
    teamId: TeamId,
    userId: UserId,
    role: TeamRole,
  ): Promise<Result<TeamMember, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError(this.createErrorMessage));
    }

    const key = this.getKey(teamId, userId);
    if (this.members.has(key)) {
      return err(new RepositoryError("User is already a member of this team"));
    }

    const member: TeamMember = {
      teamId,
      userId,
      role,
      joinedAt: new Date(),
    };

    this.members.set(key, member);
    return ok(member);
  }

  async getByTeamAndUser(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<TeamMember | null, RepositoryError>> {
    if (this.shouldFailGetByTeamAndUser) {
      return err(new RepositoryError(this.getByTeamAndUserErrorMessage));
    }

    const key = this.getKey(teamId, userId);
    const member = this.members.get(key) || null;
    return ok(member);
  }

  async updateRole(
    teamId: TeamId,
    userId: UserId,
    role: TeamRole,
  ): Promise<Result<TeamMember, RepositoryError>> {
    if (this.shouldFailUpdateRole) {
      return err(new RepositoryError(this.updateRoleErrorMessage));
    }

    const key = this.getKey(teamId, userId);
    const member = this.members.get(key);
    if (!member) {
      return err(new RepositoryError("Team member not found"));
    }

    const updatedMember: TeamMember = {
      ...member,
      role,
    };

    this.members.set(key, updatedMember);
    return ok(updatedMember);
  }

  async delete(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDelete) {
      return err(new RepositoryError(this.deleteErrorMessage));
    }

    const key = this.getKey(teamId, userId);
    if (!this.members.has(key)) {
      return err(new RepositoryError("Team member not found"));
    }

    this.members.delete(key);
    return ok(undefined);
  }

  async list(
    query: ListTeamMemberQuery,
  ): Promise<
    Result<{ items: TeamMemberWithUser[]; count: number }, RepositoryError>
  > {
    if (this.shouldFailList) {
      return err(new RepositoryError(this.listErrorMessage));
    }

    const members = Array.from(this.members.values()).filter(
      (member) => member.teamId === query.teamId,
    );

    // Apply filters
    let filteredMembers = members;
    if (query.filter?.role) {
      filteredMembers = filteredMembers.filter(
        (member) => member.role === query.filter?.role,
      );
    }

    // Convert to TeamMemberWithUser
    const membersWithUser: TeamMemberWithUser[] = filteredMembers.map(
      (member) => {
        const userProfile = this.userProfiles.get(member.userId) || {
          displayName: `User ${member.userId}`,
          email: `user${member.userId}@example.com`,
        };

        return {
          ...member,
          user: userProfile,
        };
      },
    );

    // Apply pagination
    const offset = (query.pagination.page - 1) * query.pagination.limit;
    const paginatedMembers = membersWithUser.slice(
      offset,
      offset + query.pagination.limit,
    );

    return ok({
      items: paginatedMembers,
      count: filteredMembers.length,
    });
  }

  async countByTeam(teamId: TeamId): Promise<Result<number, RepositoryError>> {
    if (this.shouldFailCountByTeam) {
      return err(new RepositoryError(this.countByTeamErrorMessage));
    }

    const count = Array.from(this.members.values()).filter(
      (member) => member.teamId === teamId,
    ).length;

    return ok(count);
  }

  async isUserInTeam(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<boolean, RepositoryError>> {
    if (this.shouldFailIsUserInTeam) {
      return err(new RepositoryError(this.isUserInTeamErrorMessage));
    }

    const key = this.getKey(teamId, userId);
    return ok(this.members.has(key));
  }

  async getUserRole(
    teamId: TeamId,
    userId: UserId,
  ): Promise<Result<TeamRole | null, RepositoryError>> {
    if (this.shouldFailGetUserRole) {
      return err(new RepositoryError(this.getUserRoleErrorMessage));
    }

    const key = this.getKey(teamId, userId);
    const member = this.members.get(key);
    return ok(member?.role || null);
  }

  // Helper methods for testing
  clear(): void {
    this.members.clear();
    this.userProfiles.clear();
    this.shouldFailCreate = false;
    this.shouldFailGetByTeamAndUser = false;
    this.shouldFailUpdateRole = false;
    this.shouldFailDelete = false;
    this.shouldFailList = false;
    this.shouldFailCountByTeam = false;
    this.shouldFailIsUserInTeam = false;
    this.shouldFailGetUserRole = false;
  }

  seed(members: TeamMember[]): void {
    this.clear();
    for (const member of members) {
      const key = this.getKey(member.teamId, member.userId);
      this.members.set(key, member);
    }
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

  setShouldFailGetByTeamAndUser(
    shouldFail: boolean,
    errorMessage?: string,
  ): void {
    this.shouldFailGetByTeamAndUser = shouldFail;
    if (errorMessage) {
      this.getByTeamAndUserErrorMessage = errorMessage;
    }
  }

  setShouldFailUpdateRole(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailUpdateRole = shouldFail;
    if (errorMessage) {
      this.updateRoleErrorMessage = errorMessage;
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

  setShouldFailCountByTeam(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailCountByTeam = shouldFail;
    if (errorMessage) {
      this.countByTeamErrorMessage = errorMessage;
    }
  }

  setShouldFailIsUserInTeam(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailIsUserInTeam = shouldFail;
    if (errorMessage) {
      this.isUserInTeamErrorMessage = errorMessage;
    }
  }

  setShouldFailGetUserRole(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailGetUserRole = shouldFail;
    if (errorMessage) {
      this.getUserRoleErrorMessage = errorMessage;
    }
  }
}
