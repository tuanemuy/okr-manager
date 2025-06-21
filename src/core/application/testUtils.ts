import { MockActivityRepository } from "@/core/adapters/mock/activityRepository";
import { MockAuthService } from "@/core/adapters/mock/authService";
import { MockInvitationRepository } from "@/core/adapters/mock/invitationRepository";
import { MockKeyResultRepository } from "@/core/adapters/mock/keyResultRepository";
import { MockNotificationRepository } from "@/core/adapters/mock/notificationRepository";
import { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockReviewRepository } from "@/core/adapters/mock/reviewRepository";
import { MockSessionManager } from "@/core/adapters/mock/sessionManager";
import { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { Context } from "./context";

export function createMockContext(): Context {
  return {
    publicUrl: "http://localhost:3000",
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
    activityRepository: new MockActivityRepository(),
    notificationRepository: new MockNotificationRepository(),
  };
}

export function createTestContext(): Context {
  return {
    publicUrl: "http://localhost:3000",
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
    activityRepository: new MockActivityRepository(),
    notificationRepository: new MockNotificationRepository(),
  };
}
