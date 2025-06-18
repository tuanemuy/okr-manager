import type { KeyResultRepository } from "@/core/domain/okr/ports/keyResultRepository";
import type { OkrRepository } from "@/core/domain/okr/ports/okrRepository";
import type { ReviewRepository } from "@/core/domain/okr/ports/reviewRepository";
import type { InvitationRepository } from "@/core/domain/team/ports/invitationRepository";
import type { TeamMemberRepository } from "@/core/domain/team/ports/teamMemberRepository";
import type { TeamRepository } from "@/core/domain/team/ports/teamRepository";
import type { PasswordHasher } from "@/core/domain/user/ports/passwordHasher";
import type { SessionManager } from "@/core/domain/user/ports/sessionManager";
import type { UserRepository } from "@/core/domain/user/ports/userRepository";

export interface Context {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  sessionManager: SessionManager;
  teamRepository: TeamRepository;
  teamMemberRepository: TeamMemberRepository;
  invitationRepository: InvitationRepository;
  okrRepository: OkrRepository;
  keyResultRepository: KeyResultRepository;
  reviewRepository: ReviewRepository;
}
