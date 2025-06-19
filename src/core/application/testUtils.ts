import { MockAuthService } from "@/core/adapters/mock/authService";
import { MockInvitationRepository } from "@/core/adapters/mock/invitationRepository";
import { MockKeyResultRepository } from "@/core/adapters/mock/keyResultRepository";
import { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockReviewRepository } from "@/core/adapters/mock/reviewRepository";
import { MockSessionManager } from "@/core/adapters/mock/sessionManager";
import { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { Context } from "./context";

export function createTestContext(): Context {
  return {
    userRepository: new MockUserRepository(),
    passwordHasher: new MockPasswordHasher(),
    sessionManager: new MockSessionManager(),
    authService: new MockAuthService(),
    teamRepository: new MockTeamRepository(),
    teamMemberRepository: new MockTeamMemberRepository(),
    invitationRepository: new MockInvitationRepository(),
    okrRepository: new MockOkrRepository(),
    keyResultRepository: new MockKeyResultRepository(),
    reviewRepository: new MockReviewRepository(),
  };
}
