import { beforeEach, describe, expect, it } from "vitest";
import type { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import type { TeamMember } from "@/core/domain/team/types";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import {
  type UpdateMemberRoleInput,
  updateMemberRole,
} from "./updateMemberRole";

describe("updateMemberRole", () => {
  let context: Context;
  let mockTeamMemberRepository: MockTeamMemberRepository;
  let adminUserId: ReturnType<typeof userIdSchema.parse>;
  let memberUserId: ReturnType<typeof userIdSchema.parse>;
  let viewerUserId: ReturnType<typeof userIdSchema.parse>;
  let nonMemberUserId: ReturnType<typeof userIdSchema.parse>;
  let teamId: ReturnType<typeof teamIdSchema.parse>;

  beforeEach(() => {
    context = createTestContext();
    mockTeamMemberRepository =
      context.teamMemberRepository as MockTeamMemberRepository;

    adminUserId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440000");
    memberUserId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440001");
    viewerUserId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440002");
    nonMemberUserId = userIdSchema.parse(
      "550e8400-e29b-41d4-a716-446655440003",
    );
    teamId = teamIdSchema.parse("team-550e8400-e29b-41d4-a716-446655440001");
  });

  const setupBasicScenario = () => {
    const adminMember: TeamMember = {
      teamId: teamId,
      userId: adminUserId,
      role: "admin",
      joinedAt: new Date(),
    };

    const regularMember: TeamMember = {
      teamId: teamId,
      userId: memberUserId,
      role: "member",
      joinedAt: new Date(),
    };

    const viewerMember: TeamMember = {
      teamId: teamId,
      userId: viewerUserId,
      role: "viewer",
      joinedAt: new Date(),
    };

    mockTeamMemberRepository.seed([adminMember, regularMember, viewerMember]);
  };

  describe("successful role updates", () => {
    beforeEach(() => {
      setupBasicScenario();
    });

    it("should allow admin to promote member to admin", async () => {
      // Arrange
      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: adminUserId,
        targetUserId: memberUserId,
        role: "admin",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(memberUserId);
        expect(result.value.role).toBe("admin");
        expect(result.value.teamId).toBe(teamId);
      }
    });

    it("should allow admin to demote member to viewer", async () => {
      // Arrange
      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: adminUserId,
        targetUserId: memberUserId,
        role: "viewer",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(memberUserId);
        expect(result.value.role).toBe("viewer");
      }
    });

    it("should allow admin to promote viewer to member", async () => {
      // Arrange
      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: adminUserId,
        targetUserId: viewerUserId,
        role: "member",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(viewerUserId);
        expect(result.value.role).toBe("member");
      }
    });
  });

  describe("admin protection rules", () => {
    beforeEach(() => {
      setupBasicScenario();
    });

    it("should prevent admin from demoting themselves when they are the last admin", async () => {
      // Arrange - single admin scenario
      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: adminUserId,
        targetUserId: adminUserId, // Admin trying to demote themselves
        role: "member",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "Cannot remove the last admin from the team",
        );
      }
    });

    it("should allow admin to demote themselves when there are other admins", async () => {
      // Arrange - add another admin first
      await mockTeamMemberRepository.updateRole(teamId, memberUserId, "admin");

      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: adminUserId,
        targetUserId: adminUserId, // Admin demoting themselves
        role: "member",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(adminUserId);
        expect(result.value.role).toBe("member");
      }
    });
  });

  describe("permission checks", () => {
    beforeEach(() => {
      setupBasicScenario();
    });

    it("should deny regular member from updating roles", async () => {
      // Arrange
      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: memberUserId, // Regular member, not admin
        targetUserId: viewerUserId,
        role: "member",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to update member roles",
        );
      }
    });

    it("should deny viewer from updating roles", async () => {
      // Arrange
      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: viewerUserId, // Viewer, not admin
        targetUserId: memberUserId,
        role: "admin",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "User is not authorized to update member roles",
        );
      }
    });

    it("should deny non-team member from updating roles", async () => {
      // Arrange
      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: nonMemberUserId, // Not a team member
        targetUserId: memberUserId,
        role: "admin",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "User is not authorized to update member roles",
        );
      }
    });
  });

  describe("input validation", () => {
    beforeEach(() => {
      setupBasicScenario();
    });

    it("should reject invalid team ID", async () => {
      // Arrange
      const input: UpdateMemberRoleInput = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        teamId: "invalid-team-id" as any,
        userId: adminUserId,
        targetUserId: memberUserId,
        role: "admin",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("should reject invalid role", async () => {
      // Arrange
      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: adminUserId,
        targetUserId: memberUserId,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        role: "invalid-role" as any,
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid input");
      }
    });
  });

  describe("error handling", () => {
    it("should handle team member repository failure when checking user permissions", async () => {
      // Arrange
      setupBasicScenario();
      mockTeamMemberRepository.setShouldFailGetByTeamAndUser(
        true,
        "Database connection failed",
      );

      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: adminUserId,
        targetUserId: memberUserId,
        role: "admin",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "User is not authorized to update member roles",
        );
      }
    });

    it("should handle repository failure when updating role", async () => {
      // Arrange
      setupBasicScenario();
      mockTeamMemberRepository.setShouldFailUpdateRole(
        true,
        "Role update failed",
      );

      const input: UpdateMemberRoleInput = {
        teamId: teamId,
        userId: adminUserId,
        targetUserId: memberUserId,
        role: "admin",
      };

      // Act
      const result = await updateMemberRole(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to update member role");
      }
    });
  });
});
