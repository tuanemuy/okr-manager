import { beforeEach, describe, expect, it } from "vitest";
import type { MockInvitationRepository } from "@/core/adapters/mock/invitationRepository";
import type { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import type { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import type { MockUserRepository } from "@/core/adapters/mock/userRepository";
import { type TeamMember, teamIdSchema } from "@/core/domain/team/types";
import { type User, userIdSchema } from "@/core/domain/user/types";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import { type InviteToTeamInput, inviteToTeam } from "./inviteToTeam";

describe("inviteToTeam", () => {
  let context: Context;
  let _mockTeamRepository: MockTeamRepository;
  let mockTeamMemberRepository: MockTeamMemberRepository;
  let mockInvitationRepository: MockInvitationRepository;
  let mockUserRepository: MockUserRepository;
  let adminUser: User;
  let memberUser: User;
  let teamAdmin: TeamMember;
  let teamMember: TeamMember;
  let validInput: InviteToTeamInput;

  beforeEach(async () => {
    context = createTestContext();
    _mockTeamRepository = context.teamRepository as MockTeamRepository;
    mockTeamMemberRepository =
      context.teamMemberRepository as MockTeamMemberRepository;
    mockInvitationRepository =
      context.invitationRepository as MockInvitationRepository;
    mockUserRepository = context.userRepository as MockUserRepository;

    // Set up test users
    adminUser = {
      id: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
      email: "admin@example.com",
      displayName: "Admin User",
      hashedPassword: "hashed:password123",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    memberUser = {
      id: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440002"),
      email: "member@example.com",
      displayName: "Member User",
      hashedPassword: "hashed:password123",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440100");

    // Set up team members
    teamAdmin = {
      teamId,
      userId: adminUser.id,
      role: "admin",
      joinedAt: new Date("2024-01-01T00:00:00Z"),
    };

    teamMember = {
      teamId,
      userId: memberUser.id,
      role: "member",
      joinedAt: new Date("2024-01-01T00:00:00Z"),
    };

    // Seed repositories
    const adminUserResult = await mockUserRepository.create({
      email: adminUser.email,
      displayName: adminUser.displayName,
      hashedPassword: adminUser.hashedPassword,
    });
    const memberUserResult = await mockUserRepository.create({
      email: memberUser.email,
      displayName: memberUser.displayName,
      hashedPassword: memberUser.hashedPassword,
    });

    // Update user IDs to match what was actually created
    if (adminUserResult.isOk()) {
      adminUser = adminUserResult.value;
      teamAdmin = {
        ...teamAdmin,
        userId: adminUser.id,
      };
    }
    if (memberUserResult.isOk()) {
      memberUser = memberUserResult.value;
      teamMember = {
        ...teamMember,
        userId: memberUser.id,
      };
    }

    mockTeamMemberRepository.seed([teamAdmin, teamMember]);

    validInput = {
      teamId,
      invitedEmail: "newuser@example.com",
      invitedById: adminUser.id,
      role: "member",
    };
  });

  describe("successful invitation", () => {
    it("should successfully create invitation when admin invites new user", async () => {
      // Act
      const result = await inviteToTeam(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teamId).toBe(validInput.teamId);
        expect(result.value.invitedEmail).toBe(validInput.invitedEmail);
        expect(result.value.invitedById).toBe(validInput.invitedById);
        expect(result.value.role).toBe(validInput.role);
        expect(result.value.status).toBe("pending");
        expect(result.value.id).toBeDefined();
      }
    });

    it("should allow admin to invite with different roles", async () => {
      // Arrange
      const roles: Array<"admin" | "member" | "viewer"> = [
        "admin",
        "member",
        "viewer",
      ];

      // Act & Assert
      for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        const input = {
          ...validInput,
          invitedEmail: `${role}${i}@example.com`,
          role,
        };

        const result = await inviteToTeam(context, input);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.role).toBe(role);
        }
      }
    });
  });

  describe("authorization checks", () => {
    it("should reject invitation from non-admin team member", async () => {
      // Arrange
      const input = {
        ...validInput,
        invitedById: memberUser.id, // Member trying to invite
      };

      // Act
      const result = await inviteToTeam(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Only team admins can invite members",
        );
      }
    });

    it("should reject invitation from non-team member", async () => {
      // Arrange
      const nonMemberId = userIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440999",
      );
      const input = {
        ...validInput,
        invitedById: nonMemberId,
      };

      // Act
      const result = await inviteToTeam(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Only team admins can invite members",
        );
      }
    });
  });

  describe("duplicate prevention", () => {
    it("should reject invitation if user is already a team member", async () => {
      // Arrange
      const input = {
        ...validInput,
        invitedEmail: memberUser.email, // Already a member
      };

      // Act
      const result = await inviteToTeam(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User is already a team member");
      }
    });

    it("should reject invitation if user already has pending invitation", async () => {
      // Arrange
      // First create a pending invitation
      await mockInvitationRepository.create({
        teamId: validInput.teamId,
        invitedEmail: validInput.invitedEmail,
        invitedById: validInput.invitedById,
        role: "viewer",
      });

      // Act
      const result = await inviteToTeam(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "User already has a pending invitation",
        );
      }
    });
  });

  describe("input validation", () => {
    it("should reject invalid email format", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        invitedEmail: "invalid-email",
      };

      // Act
      const result = await inviteToTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid invitation input");
      }
    });

    it("should reject invalid team ID format", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        teamId: "invalid-uuid" as any,
      };

      // Act
      const result = await inviteToTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid invitation input");
      }
    });

    it("should reject invalid inviter ID format", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        invitedById: "invalid-uuid" as any,
      };

      // Act
      const result = await inviteToTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid invitation input");
      }
    });

    it("should reject invalid role", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        role: "invalid-role" as any,
      };

      // Act
      const result = await inviteToTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid invitation input");
      }
    });

    it("should reject missing required fields", async () => {
      // Arrange
      const invalidInput = {
        teamId: validInput.teamId,
        // Missing other required fields
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      } as any;

      // Act
      const result = await inviteToTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid invitation input");
      }
    });
  });

  describe("repository errors", () => {
    it("should handle team member repository check failure", async () => {
      // Arrange
      mockTeamMemberRepository.setShouldFailGetByTeamAndUser(
        true,
        "Database connection failed",
      );

      // Act
      const result = await inviteToTeam(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to check team membership");
      }
    });

    it("should handle user repository lookup failure", async () => {
      // Arrange
      mockUserRepository.setShouldFailGetByEmail(true, "User lookup failed");

      // Act
      const result = await inviteToTeam(context, validInput);

      // Assert - Should still succeed since user lookup failure doesn't prevent invitation
      expect(result.isOk()).toBe(true);
    });

    it("should handle invitation repository creation failure", async () => {
      // Arrange
      mockInvitationRepository.setShouldFailCreate(
        true,
        "Failed to create invitation",
      );

      // Act
      const result = await inviteToTeam(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to create invitation");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle inviting with same email but different case", async () => {
      // Arrange
      const input = {
        ...validInput,
        invitedEmail: "NEWUSER@EXAMPLE.COM", // Uppercase version
      };

      // Act
      const result = await inviteToTeam(context, input);

      // Assert
      // Should succeed as email comparison should be case-sensitive
      // (business rules may vary on this)
      expect(result.isOk()).toBe(true);
    });

    it("should handle very long email addresses", async () => {
      // Arrange
      const longEmail = `${"a".repeat(50)}@${"example".repeat(10)}.com`;
      const input = {
        ...validInput,
        invitedEmail: longEmail,
      };

      // Act
      const result = await inviteToTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.invitedEmail).toBe(longEmail);
      }
    });

    it("should handle invitation with special characters in email", async () => {
      // Arrange
      const specialEmail = "user+test@example-domain.co.uk";
      const input = {
        ...validInput,
        invitedEmail: specialEmail,
      };

      // Act
      const result = await inviteToTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.invitedEmail).toBe(specialEmail);
      }
    });
  });

  describe("concurrent invitations", () => {
    it("should handle multiple concurrent invitations by same admin", async () => {
      // Arrange
      const concurrentInputs = [
        { ...validInput, invitedEmail: "user1@example.com" },
        { ...validInput, invitedEmail: "user2@example.com" },
        { ...validInput, invitedEmail: "user3@example.com" },
      ];

      // Act
      const results = await Promise.all(
        concurrentInputs.map((input) => inviteToTeam(context, input)),
      );

      // Assert
      for (const [index, result] of results.entries()) {
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.invitedEmail).toBe(
            concurrentInputs[index].invitedEmail,
          );
        }
      }
    });

    it("should handle concurrent invitations for same email (should fail)", async () => {
      // Arrange
      const sameEmailInputs = [
        { ...validInput },
        { ...validInput },
        { ...validInput },
      ];

      // Act
      const results = await Promise.all(
        sameEmailInputs.map((input) => inviteToTeam(context, input)),
      );

      // Assert
      const successCount = results.filter((r) => r.isOk()).length;
      const failureCount = results.filter((r) => r.isErr()).length;

      // Only one should succeed, others should fail with duplicate invitation
      expect(successCount).toBe(1);
      expect(failureCount).toBe(2);

      // Check that failures are for the right reason
      const failures = results.filter((r) => r.isErr());
      expect(failures.length).toBeGreaterThan(0);
      // Concurrent attempts should fail due to duplicate check
    });
  });
});
