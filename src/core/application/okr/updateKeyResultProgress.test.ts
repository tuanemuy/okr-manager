import { beforeEach, describe, expect, it } from "vitest";
import type { MockKeyResultRepository } from "@/core/adapters/mock/keyResultRepository";
import type { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import type { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import {
  type KeyResult,
  keyResultIdSchema,
  type Okr,
  okrIdSchema,
} from "@/core/domain/okr/types";
import { type TeamMember, teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import {
  type UpdateKeyResultProgressInput,
  updateKeyResultProgress,
} from "./updateKeyResultProgress";

describe("updateKeyResultProgress", () => {
  let context: Context;
  let mockTeamMemberRepository: MockTeamMemberRepository;
  let mockOkrRepository: MockOkrRepository;
  let mockKeyResultRepository: MockKeyResultRepository;
  let adminMember: TeamMember;
  let okrOwner: TeamMember;
  let regularMember: TeamMember;
  let viewer: TeamMember;
  let teamOkr: Okr;
  let individualOkr: Okr;
  let keyResult1: KeyResult;
  let keyResult2: KeyResult;
  let validInput: UpdateKeyResultProgressInput;

  beforeEach(() => {
    context = createTestContext();
    mockTeamMemberRepository =
      context.teamMemberRepository as MockTeamMemberRepository;
    mockOkrRepository = context.okrRepository as MockOkrRepository;
    mockKeyResultRepository =
      context.keyResultRepository as MockKeyResultRepository;

    const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440100");
    const adminUserId = userIdSchema.parse(
      "550e8400-e29b-41d4-a716-446655440001",
    );
    const ownerUserId = userIdSchema.parse(
      "550e8400-e29b-41d4-a716-446655440002",
    );
    const memberUserId = userIdSchema.parse(
      "550e8400-e29b-41d4-a716-446655440003",
    );
    const viewerUserId = userIdSchema.parse(
      "550e8400-e29b-41d4-a716-446655440004",
    );

    // Set up team members
    adminMember = {
      teamId,
      userId: adminUserId,
      role: "admin",
      joinedAt: new Date("2024-01-01T00:00:00Z"),
    };

    okrOwner = {
      teamId,
      userId: ownerUserId,
      role: "member",
      joinedAt: new Date("2024-01-01T00:00:00Z"),
    };

    regularMember = {
      teamId,
      userId: memberUserId,
      role: "member",
      joinedAt: new Date("2024-01-01T00:00:00Z"),
    };

    viewer = {
      teamId,
      userId: viewerUserId,
      role: "viewer",
      joinedAt: new Date("2024-01-01T00:00:00Z"),
    };

    // Set up OKRs
    teamOkr = {
      id: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440200"),
      title: "Team Productivity OKR",
      description: "Improve team productivity",
      type: "team",
      teamId,
      ownerId: adminUserId,
      quarterYear: 2024,
      quarterQuarter: 2,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    individualOkr = {
      id: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440201"),
      title: "Personal Development OKR",
      description: "Personal skill enhancement",
      type: "personal",
      teamId,
      ownerId: ownerUserId,
      quarterYear: 2024,
      quarterQuarter: 2,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    // Set up key results
    keyResult1 = {
      id: keyResultIdSchema.parse("550e8400-e29b-41d4-a716-446655440300"),
      okrId: teamOkr.id,
      title: "Increase deployment frequency",
      targetValue: 50,
      currentValue: 20,
      unit: "deployments",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    keyResult2 = {
      id: keyResultIdSchema.parse("550e8400-e29b-41d4-a716-446655440301"),
      okrId: individualOkr.id,
      title: "Complete training courses",
      targetValue: 5,
      currentValue: 2,
      unit: "courses",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    // Seed repositories
    mockTeamMemberRepository.seed([
      adminMember,
      okrOwner,
      regularMember,
      viewer,
    ]);
    mockOkrRepository.seed([teamOkr, individualOkr]);
    mockKeyResultRepository.seed([keyResult1, keyResult2]);

    validInput = {
      keyResultId: keyResult1.id,
      currentValue: 35,
      userId: adminUserId,
    };
  });

  describe("successful progress updates", () => {
    it("should successfully update progress when admin updates any key result", async () => {
      // Act
      const result = await updateKeyResultProgress(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(35);
        expect(result.value.id).toBe(keyResult1.id);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should successfully update progress when OKR owner updates their key result", async () => {
      // Arrange
      const input = {
        keyResultId: keyResult2.id, // Individual OKR owned by okrOwner
        currentValue: 4,
        userId: okrOwner.userId,
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(4);
        expect(result.value.id).toBe(keyResult2.id);
      }
    });

    it("should allow progress to be updated to zero", async () => {
      // Arrange
      const input = {
        ...validInput,
        currentValue: 0,
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(0);
      }
    });

    it("should allow progress to exceed target value", async () => {
      // Arrange
      const input = {
        ...validInput,
        currentValue: 75, // Exceeds target of 50
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(75);
      }
    });
  });

  describe("authorization checks", () => {
    it("should reject update by regular member who is not OKR owner", async () => {
      // Arrange
      const input = {
        ...validInput,
        userId: regularMember.userId, // Not admin, not owner
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Permission denied: only OKR owner or team admin can update progress",
        );
      }
    });

    it("should reject update by viewer", async () => {
      // Arrange
      const input = {
        ...validInput,
        userId: viewer.userId,
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Permission denied: only OKR owner or team admin can update progress",
        );
      }
    });

    it("should reject update by non-team member", async () => {
      // Arrange
      const nonMemberId = userIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440999",
      );
      const input = {
        ...validInput,
        userId: nonMemberId,
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User is not a team member");
      }
    });

    it("should reject update when OKR owner tries to update other's key result", async () => {
      // Arrange
      const input = {
        keyResultId: keyResult1.id, // Team OKR owned by admin
        currentValue: 40,
        userId: okrOwner.userId, // Different user trying to update
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Permission denied: only OKR owner or team admin can update progress",
        );
      }
    });
  });

  describe("input validation", () => {
    it("should reject invalid key result ID format", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        keyResultId: "invalid-uuid" as any,
      };

      // Act
      const result = await updateKeyResultProgress(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("should reject negative current value", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        currentValue: -5,
      };

      // Act
      const result = await updateKeyResultProgress(context, invalidInput);

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
      const result = await updateKeyResultProgress(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("should reject missing required fields", async () => {
      // Arrange
      const invalidInput = {
        keyResultId: validInput.keyResultId,
        // Missing currentValue and userId
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      } as any;

      // Act
      const result = await updateKeyResultProgress(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid input");
      }
    });
  });

  describe("entity validation", () => {
    it("should reject update for non-existent key result", async () => {
      // Arrange
      const input = {
        ...validInput,
        keyResultId: keyResultIdSchema.parse(
          "550e8400-e29b-41d4-a716-446655440999",
        ),
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Key result not found");
      }
    });

    it("should reject update when associated OKR is not found", async () => {
      // Arrange
      // Create a key result with non-existent OKR ID
      const orphanKeyResult: KeyResult = {
        ...keyResult1,
        id: keyResultIdSchema.parse("550e8400-e29b-41d4-a716-446655440302"),
        okrId: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440999"), // Non-existent
      };
      mockKeyResultRepository.seed([
        ...mockKeyResultRepository.getByOkrId(teamOkr.id),
        orphanKeyResult,
      ]);

      const input = {
        ...validInput,
        keyResultId: orphanKeyResult.id,
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("OKR not found");
      }
    });
  });

  describe("repository errors", () => {
    it("should handle key result repository get failure", async () => {
      // Arrange
      mockKeyResultRepository.setShouldFailGetById(
        true,
        "Database connection failed",
      );

      // Act
      const result = await updateKeyResultProgress(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to get key result");
      }
    });

    it("should handle OKR repository get failure", async () => {
      // Arrange
      mockOkrRepository.setShouldFailGetById(true, "OKR lookup failed");

      // Act
      const result = await updateKeyResultProgress(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to get OKR");
      }
    });

    it("should handle team member repository check failure", async () => {
      // Arrange
      mockTeamMemberRepository.setShouldFailGetByTeamAndUser(
        true,
        "Membership check failed",
      );

      // Act
      const result = await updateKeyResultProgress(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to check team membership");
      }
    });

    it("should handle key result update progress failure", async () => {
      // Arrange
      mockKeyResultRepository.setShouldFailUpdateProgress(
        true,
        "Update failed",
      );

      // Act
      const result = await updateKeyResultProgress(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Update failed");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle decimal progress values", async () => {
      // Arrange
      const input = {
        ...validInput,
        currentValue: 35.75,
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(35.75);
      }
    });

    it("should handle very large progress values", async () => {
      // Arrange
      const input = {
        ...validInput,
        currentValue: 999999.99,
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(999999.99);
      }
    });

    it("should handle team OKR without explicit owner", async () => {
      // Arrange
      const teamOkrWithoutOwner: Okr = {
        ...teamOkr,
        id: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440202"),
        ownerId: undefined, // No explicit owner
      };

      const keyResultWithoutOwner: KeyResult = {
        ...keyResult1,
        id: keyResultIdSchema.parse("550e8400-e29b-41d4-a716-446655440303"),
        okrId: teamOkrWithoutOwner.id,
      };

      mockOkrRepository.seed([teamOkr, individualOkr, teamOkrWithoutOwner]);
      mockKeyResultRepository.seed([
        keyResult1,
        keyResult2,
        keyResultWithoutOwner,
      ]);

      const input = {
        keyResultId: keyResultWithoutOwner.id,
        currentValue: 30,
        userId: regularMember.userId, // Regular member trying to update
      };

      // Act
      const result = await updateKeyResultProgress(context, input);

      // Assert
      // Should fail because regular member is not admin and there's no owner to match against
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Permission denied: only OKR owner or team admin can update progress",
        );
      }
    });
  });

  describe("business logic validation", () => {
    it("should preserve other key result properties during update", async () => {
      // Act
      const result = await updateKeyResultProgress(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe(keyResult1.title);
        expect(result.value.targetValue).toBe(keyResult1.targetValue);
        expect(result.value.unit).toBe(keyResult1.unit);
        expect(result.value.okrId).toBe(keyResult1.okrId);
        expect(result.value.currentValue).toBe(35); // Only this should change
      }
    });

    it("should update timestamp when progress is updated", async () => {
      // Arrange
      const originalUpdateTime = keyResult1.updatedAt;

      // Act
      const result = await updateKeyResultProgress(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.updatedAt.getTime()).toBeGreaterThan(
          originalUpdateTime.getTime(),
        );
      }
    });
  });
});
