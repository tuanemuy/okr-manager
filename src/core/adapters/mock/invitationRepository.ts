import type { InvitationRepository } from "@/core/domain/team/ports/invitationRepository";
import type {
  CreateInvitationParams,
  Invitation,
  InvitationId,
  InvitationStatus,
  InvitationWithTeam,
  ListInvitationQuery,
  TeamId,
} from "@/core/domain/team/types";
import { RepositoryError } from "@/lib/error";
import { type Result, err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

export class MockInvitationRepository implements InvitationRepository {
  private invitations: Map<InvitationId, Invitation> = new Map();
  private teamProfiles: Map<TeamId, { name: string; description?: string }> =
    new Map();
  private userProfiles: Map<string, { displayName: string; email: string }> =
    new Map();
  private shouldFailCreate = false;
  private shouldFailGetById = false;
  private shouldFailUpdateStatus = false;
  private shouldFailDelete = false;
  private shouldFailList = false;
  private shouldFailListByEmail = false;
  private shouldFailGetByTeamAndEmail = false;
  private createErrorMessage = "Failed to create invitation";
  private getByIdErrorMessage = "Failed to get invitation by ID";
  private updateStatusErrorMessage = "Failed to update invitation status";
  private deleteErrorMessage = "Failed to delete invitation";
  private listErrorMessage = "Failed to list invitations";
  private listByEmailErrorMessage = "Failed to list invitations by email";
  private getByTeamAndEmailErrorMessage =
    "Failed to get invitation by team and email";

  async create(
    params: CreateInvitationParams,
  ): Promise<Result<Invitation, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError(this.createErrorMessage));
    }

    // Check if invitation already exists for this team/email combination
    const existingInvitation = Array.from(this.invitations.values()).find(
      (inv) =>
        inv.teamId === params.teamId &&
        inv.invitedEmail === params.invitedEmail &&
        inv.status === "pending",
    );

    if (existingInvitation) {
      return err(
        new RepositoryError(
          "Invitation already exists for this team and email",
        ),
      );
    }

    const id = uuidv7() as InvitationId;
    const invitation: Invitation = {
      id,
      teamId: params.teamId,
      invitedEmail: params.invitedEmail,
      invitedById: params.invitedById,
      role: params.role,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.invitations.set(id, invitation);
    return ok(invitation);
  }

  async getById(
    id: InvitationId,
  ): Promise<Result<InvitationWithTeam | null, RepositoryError>> {
    if (this.shouldFailGetById) {
      return err(new RepositoryError(this.getByIdErrorMessage));
    }

    const invitation = this.invitations.get(id);
    if (!invitation) {
      return ok(null);
    }

    const teamProfile = this.teamProfiles.get(invitation.teamId) || {
      name: `Team ${invitation.teamId}`,
      description: undefined,
    };

    const inviterProfile = this.userProfiles.get(invitation.invitedById) || {
      displayName: `User ${invitation.invitedById}`,
      email: `user${invitation.invitedById}@example.com`,
    };

    const invitationWithTeam: InvitationWithTeam = {
      ...invitation,
      team: teamProfile,
      invitedBy: inviterProfile,
    };

    return ok(invitationWithTeam);
  }

  async updateStatus(
    id: InvitationId,
    status: InvitationStatus,
  ): Promise<Result<Invitation, RepositoryError>> {
    if (this.shouldFailUpdateStatus) {
      return err(new RepositoryError(this.updateStatusErrorMessage));
    }

    const invitation = this.invitations.get(id);
    if (!invitation) {
      return err(new RepositoryError("Invitation not found"));
    }

    const updatedInvitation: Invitation = {
      ...invitation,
      status,
      updatedAt: new Date(),
    };

    this.invitations.set(id, updatedInvitation);
    return ok(updatedInvitation);
  }

  async delete(id: InvitationId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDelete) {
      return err(new RepositoryError(this.deleteErrorMessage));
    }

    if (!this.invitations.has(id)) {
      return err(new RepositoryError("Invitation not found"));
    }

    this.invitations.delete(id);
    return ok(undefined);
  }

  async list(
    query: ListInvitationQuery,
  ): Promise<
    Result<{ items: InvitationWithTeam[]; count: number }, RepositoryError>
  > {
    if (this.shouldFailList) {
      return err(new RepositoryError(this.listErrorMessage));
    }

    const invitations = Array.from(this.invitations.values());

    // Apply filters
    let filteredInvitations = invitations;
    if (query.filter?.teamId) {
      filteredInvitations = filteredInvitations.filter(
        (inv) => inv.teamId === query.filter?.teamId,
      );
    }
    if (query.filter?.invitedEmail) {
      filteredInvitations = filteredInvitations.filter(
        (inv) => inv.invitedEmail === query.filter?.invitedEmail,
      );
    }
    if (query.filter?.status) {
      filteredInvitations = filteredInvitations.filter(
        (inv) => inv.status === query.filter?.status,
      );
    }

    // Convert to InvitationWithTeam
    const invitationsWithTeam: InvitationWithTeam[] = filteredInvitations.map(
      (invitation) => {
        const teamProfile = this.teamProfiles.get(invitation.teamId) || {
          name: `Team ${invitation.teamId}`,
          description: undefined,
        };

        const inviterProfile = this.userProfiles.get(
          invitation.invitedById,
        ) || {
          displayName: `User ${invitation.invitedById}`,
          email: `user${invitation.invitedById}@example.com`,
        };

        return {
          ...invitation,
          team: teamProfile,
          invitedBy: inviterProfile,
        };
      },
    );

    // Apply pagination
    const offset = (query.pagination.page - 1) * query.pagination.limit;
    const paginatedInvitations = invitationsWithTeam.slice(
      offset,
      offset + query.pagination.limit,
    );

    return ok({
      items: paginatedInvitations,
      count: filteredInvitations.length,
    });
  }

  async listByEmail(
    email: string,
  ): Promise<Result<InvitationWithTeam[], RepositoryError>> {
    if (this.shouldFailListByEmail) {
      return err(new RepositoryError(this.listByEmailErrorMessage));
    }

    const invitations = Array.from(this.invitations.values()).filter(
      (inv) => inv.invitedEmail === email,
    );

    const invitationsWithTeam: InvitationWithTeam[] = invitations.map(
      (invitation) => {
        const teamProfile = this.teamProfiles.get(invitation.teamId) || {
          name: `Team ${invitation.teamId}`,
          description: undefined,
        };

        const inviterProfile = this.userProfiles.get(
          invitation.invitedById,
        ) || {
          displayName: `User ${invitation.invitedById}`,
          email: `user${invitation.invitedById}@example.com`,
        };

        return {
          ...invitation,
          team: teamProfile,
          invitedBy: inviterProfile,
        };
      },
    );

    return ok(invitationsWithTeam);
  }

  async getByTeamAndEmail(
    teamId: TeamId,
    email: string,
  ): Promise<Result<Invitation | null, RepositoryError>> {
    if (this.shouldFailGetByTeamAndEmail) {
      return err(new RepositoryError(this.getByTeamAndEmailErrorMessage));
    }

    const invitation =
      Array.from(this.invitations.values()).find(
        (inv) => inv.teamId === teamId && inv.invitedEmail === email,
      ) || null;

    return ok(invitation);
  }

  // Helper methods for testing
  clear(): void {
    this.invitations.clear();
    this.teamProfiles.clear();
    this.userProfiles.clear();
    this.shouldFailCreate = false;
    this.shouldFailGetById = false;
    this.shouldFailUpdateStatus = false;
    this.shouldFailDelete = false;
    this.shouldFailList = false;
    this.shouldFailListByEmail = false;
    this.shouldFailGetByTeamAndEmail = false;
  }

  seed(invitations: Invitation[]): void {
    this.clear();
    for (const invitation of invitations) {
      this.invitations.set(invitation.id, invitation);
    }
  }

  setTeamProfile(
    teamId: TeamId,
    profile: { name: string; description?: string },
  ): void {
    this.teamProfiles.set(teamId, profile);
  }

  setUserProfile(
    userId: string,
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

  setShouldFailUpdateStatus(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailUpdateStatus = shouldFail;
    if (errorMessage) {
      this.updateStatusErrorMessage = errorMessage;
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

  setShouldFailListByEmail(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailListByEmail = shouldFail;
    if (errorMessage) {
      this.listByEmailErrorMessage = errorMessage;
    }
  }

  setShouldFailGetByTeamAndEmail(
    shouldFail: boolean,
    errorMessage?: string,
  ): void {
    this.shouldFailGetByTeamAndEmail = shouldFail;
    if (errorMessage) {
      this.getByTeamAndEmailErrorMessage = errorMessage;
    }
  }
}
