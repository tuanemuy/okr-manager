import type { RepositoryError } from "@/lib/error";
import type { Result } from "neverthrow";
import type {
  CreateInvitationParams,
  Invitation,
  InvitationId,
  InvitationStatus,
  InvitationWithTeam,
  ListInvitationQuery,
} from "../types";

export interface InvitationRepository {
  create(
    params: CreateInvitationParams,
  ): Promise<Result<Invitation, RepositoryError>>;
  findById(
    id: InvitationId,
  ): Promise<Result<InvitationWithTeam | null, RepositoryError>>;
  updateStatus(
    id: InvitationId,
    status: InvitationStatus,
  ): Promise<Result<Invitation, RepositoryError>>;
  delete(id: InvitationId): Promise<Result<void, RepositoryError>>;
  list(
    query: ListInvitationQuery,
  ): Promise<
    Result<{ items: InvitationWithTeam[]; count: number }, RepositoryError>
  >;
  listByEmail(
    email: string,
  ): Promise<Result<InvitationWithTeam[], RepositoryError>>;
}
