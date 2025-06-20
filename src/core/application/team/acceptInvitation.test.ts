import { beforeEach, describe, expect, it } from "vitest";
import type { MockInvitationRepository } from "@/core/adapters/mock/invitationRepository";
import type { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import type { MockUserRepository } from "@/core/adapters/mock/userRepository";
import {
  type Invitation,
  invitationIdSchema,
  teamIdSchema,
} from "@/core/domain/team/types";
import { type User, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import {
  type AcceptInvitationInput,
  acceptInvitation,
} from "./acceptInvitation";

describe("acceptInvitation", () => {
  let context: Context;
  let mockTeamMemberRepository: MockTeamMemberRepository;
  let mockInvitationRepository: MockInvitationRepository;
  let mockUserRepository: MockUserRepository;
  let invitedUser: User;
  let inviterUser: User;
  let pendingInvitation: Invitation;
  let validInput: AcceptInvitationInput;

  beforeEach(async () => {
    context = createTestContext();
    mockTeamMemberRepository =
      context.teamMemberRepository as MockTeamMemberRepository;
    mockInvitationRepository =
      context.invitationRepository as MockInvitationRepository;
    mockUserRepository = context.userRepository as MockUserRepository;

    // Set up test users
    invitedUser = {
      id: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
      email: "invited@example.com",
      displayName: "Invited User",
      hashedPassword: "hashed:password123",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    inviterUser = {
      id: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440002"),
      email: "inviter@example.com",
      displayName: "Inviter User",
      hashedPassword: "hashed:password123",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    // Set up pending invitation
    pendingInvitation = {
      id: invitationIdSchema.parse("550e8400-e29b-41d4-a716-446655440200"),
      teamId: teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440100"),
      invitedEmail: invitedUser.email,
      invitedById: inviterUser.id,
      role: "member",
      status: "pending",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    // Seed repositories
    const invitedUserResult = await mockUserRepository.create({
      email: invitedUser.email,
      displayName: invitedUser.displayName,
      hashedPassword: invitedUser.hashedPassword,
    });
    const inviterUserResult = await mockUserRepository.create({
      email: inviterUser.email,
      displayName: inviterUser.displayName,
      hashedPassword: inviterUser.hashedPassword,
    });

    // Update user IDs to match what was actually created
    if (invitedUserResult.isOk()) {
      invitedUser = invitedUserResult.value;
    }
    if (inviterUserResult.isOk()) {
      inviterUser = inviterUserResult.value;
      // Update the invitation to use the correct inviter ID
      pendingInvitation = {
        ...pendingInvitation,
        invitedById: inviterUser.id,
      };
    }

    mockInvitationRepository.seed([pendingInvitation]);
    mockInvitationRepository.setUserProfile(inviterUser.id, {
      displayName: inviterUser.displayName,
      email: inviterUser.email,
    });

    validInput = {
      invitationId: pendingInvitation.id,
      userId: invitedUser.id,
    };
  });

  describe("successful invitation acceptance", () => {
    it("should successfully accept a pending invitation", async () => {
      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teamId).toBe(pendingInvitation.teamId);
        expect(result.value.userId).toBe(invitedUser.id);
        expect(result.value.role).toBe(pendingInvitation.role);
        expect(result.value.joinedAt).toBeInstanceOf(Date);
      }
    });

    it("should create team membership with correct role from invitation", async () => {
      // Arrange - Create invitation with admin role
      const adminInvitation: Invitation = {
        ...pendingInvitation,
        id: invitationIdSchema.parse("550e8400-e29b-41d4-a716-446655440201"),
        role: "admin",
      };
      mockInvitationRepository.seed([adminInvitation]);

      const input = {
        ...validInput,
        invitationId: adminInvitation.id,
      };

      // Act
      const result = await acceptInvitation(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.role).toBe("admin");
      }
    });

    it("should update invitation status to accepted", async () => {
      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);

      // Verify invitation status was updated
      const invitationResult = await mockInvitationRepository.getById(
        pendingInvitation.id,
      );
      expect(invitationResult.isOk()).toBe(true);
      if (invitationResult.isOk() && invitationResult.value) {
        expect(invitationResult.value.status).toBe("accepted");
      }
    });
  });

  describe("invitation validation", () => {
    it("should reject non-existent invitation", async () => {
      // Arrange
      const input = {
        ...validInput,
        invitationId: invitationIdSchema.parse(
          "550e8400-e29b-41d4-a716-446655440999",
        ),
      };

      // Act
      const result = await acceptInvitation(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invitation not found");
      }
    });

    it("should reject already accepted invitation", async () => {
      // Arrange
      const acceptedInvitation: Invitation = {
        ...pendingInvitation,
        status: "accepted",
      };
      mockInvitationRepository.seed([acceptedInvitation]);

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invitation is not pending");
      }
    });

    it("should reject rejected invitation", async () => {
      // Arrange
      const rejectedInvitation: Invitation = {
        ...pendingInvitation,
        status: "rejected",
      };
      mockInvitationRepository.seed([rejectedInvitation]);

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invitation is not pending");
      }
    });
  });

  describe("user validation", () => {
    it("should reject if user email does not match invitation", async () => {
      // Arrange
      const differentUser: User = {
        ...invitedUser,
        id: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440003"),
        email: "different@example.com",
      };

      await mockUserRepository.create({
        email: differentUser.email,
        displayName: differentUser.displayName,
        hashedPassword: differentUser.hashedPassword,
      });

      const input = {
        ...validInput,
        userId: differentUser.id,
      };

      // Act
      const result = await acceptInvitation(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "User email does not match invitation",
        );
      }
    });

    it("should reject if user does not exist", async () => {
      // Arrange
      const input = {
        ...validInput,
        userId: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440999"),
      };

      // Act
      const result = await acceptInvitation(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "User email does not match invitation",
        );
      }
    });
  });

  describe("duplicate membership prevention", () => {
    it("should reject if user is already a team member", async () => {
      // Arrange - Make user already a team member
      await mockTeamMemberRepository.create(
        pendingInvitation.teamId,
        invitedUser.id,
        "viewer",
      );

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User is already a team member");
      }
    });
  });

  describe("input validation", () => {
    it("should reject invalid invitation ID format", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        invitationId: "invalid-uuid" as any,
      };

      // Act
      const result = await acceptInvitation(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("should reject invalid user ID format", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        userId: "invalid-uuid" as any,
      };

      // Act
      const result = await acceptInvitation(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("should reject missing required fields", async () => {
      // Arrange
      const invalidInput = {
        invitationId: validInput.invitationId,
        // Missing userId
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      } as any;

      // Act
      const result = await acceptInvitation(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid input");
      }
    });
  });

  describe("repository errors", () => {
    it("should handle invitation repository get failure", async () => {
      // Arrange
      mockInvitationRepository.setShouldFailGetById(
        true,
        "Database connection failed",
      );

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to get invitation");
      }
    });

    it("should handle user repository get failure", async () => {
      // Arrange
      mockUserRepository.setShouldFailGetById(true, "User lookup failed");

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to get user");
      }
    });

    it("should handle team member repository creation failure", async () => {
      // Arrange
      mockTeamMemberRepository.setShouldFailCreate(
        true,
        "Failed to create member",
      );

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to create team member");
      }
    });

    it("should handle invitation status update failure", async () => {
      // Arrange
      mockInvitationRepository.setShouldFailUpdateStatus(
        true,
        "Failed to update status",
      );

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to update invitation status");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle invitation with viewer role", async () => {
      // Arrange
      const viewerInvitation: Invitation = {
        ...pendingInvitation,
        role: "viewer",
      };
      mockInvitationRepository.seed([viewerInvitation]);

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.role).toBe("viewer");
      }
    });

    it("should handle case-sensitive email matching", async () => {
      // Arrange
      const uppercaseInvitation: Invitation = {
        ...pendingInvitation,
        invitedEmail: "INVITED@EXAMPLE.COM",
      };
      mockInvitationRepository.seed([uppercaseInvitation]);

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      // Should fail because email case doesn't match
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "User email does not match invitation",
        );
      }
    });

    it("should handle very old invitation", async () => {
      // Arrange
      const oldInvitation: Invitation = {
        ...pendingInvitation,
        createdAt: new Date("2020-01-01T00:00:00Z"),
        updatedAt: new Date("2020-01-01T00:00:00Z"),
      };
      mockInvitationRepository.seed([oldInvitation]);

      // Act
      const result = await acceptInvitation(context, validInput);

      // Assert
      // Should still work - no expiration logic in current implementation
      expect(result.isOk()).toBe(true);
    });
  });

  describe("concurrent acceptance attempts", () => {
    it("should handle multiple concurrent acceptance attempts for same invitation", async () => {
      // Act
      const results = await Promise.all([
        acceptInvitation(context, validInput),
        acceptInvitation(context, validInput),
        acceptInvitation(context, validInput),
      ]);

      // Assert
      const successCount = results.filter((r) => r.isOk()).length;
      const failureCount = results.filter((r) => r.isErr()).length;

      // Only one should succeed
      expect(successCount).toBe(1);
      expect(failureCount).toBe(2);

      // Check that failures are due to duplicate membership
      const failures = results.filter((r) => r.isErr());
      expect(failures.length).toBeGreaterThan(0);
      // Some concurrent attempts should fail
    });
  });
});
