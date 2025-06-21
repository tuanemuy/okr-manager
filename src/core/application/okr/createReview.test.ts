import { beforeEach, describe, expect, it } from "vitest";
import type { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import type { MockReviewRepository } from "@/core/adapters/mock/reviewRepository";
import type { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import { type Okr, okrIdSchema } from "@/core/domain/okr/types";
import { type TeamMember, teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import { type CreateReviewInput, createReview } from "./createReview";

describe("createReview", () => {
  let context: Context;
  let mockTeamMemberRepository: MockTeamMemberRepository;
  let mockOkrRepository: MockOkrRepository;
  let mockReviewRepository: MockReviewRepository;
  let adminMember: TeamMember;
  let okrOwner: TeamMember;
  let regularMember: TeamMember;
  let viewer: TeamMember;
  let teamOkr: Okr;
  let individualOkr: Okr;
  let okrWithoutOwner: Okr;
  let validProgressReviewInput: CreateReviewInput;
  let validFinalReviewInput: CreateReviewInput;

  beforeEach(() => {
    context = createTestContext();
    mockTeamMemberRepository =
      context.teamMemberRepository as MockTeamMemberRepository;
    mockOkrRepository = context.okrRepository as MockOkrRepository;
    mockReviewRepository = context.reviewRepository as MockReviewRepository;

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

    okrWithoutOwner = {
      id: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440202"),
      title: "Ownerless Team OKR",
      description: "Team OKR without specific owner",
      type: "team",
      teamId,
      ownerId: undefined,
      quarterYear: 2024,
      quarterQuarter: 2,
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
    mockOkrRepository.seed([teamOkr, individualOkr, okrWithoutOwner]);

    validProgressReviewInput = {
      okrId: teamOkr.id,
      type: "progress",
      content:
        "Great progress this quarter. Team velocity has improved significantly and we're on track to meet all our key results. The deployment automation has reduced our release time by 40%.",
      reviewerId: adminUserId,
    };

    validFinalReviewInput = {
      okrId: individualOkr.id,
      type: "final",
      content:
        "Successfully completed all training objectives. Learned React, TypeScript, and GraphQL. Ready to apply these skills in upcoming projects.",
      reviewerId: ownerUserId,
    };
  });

  describe("successful review creation", () => {
    it("should successfully create progress review when admin creates it", async () => {
      // Act
      const result = await createReview(context, validProgressReviewInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.okrId).toBe(validProgressReviewInput.okrId);
        expect(result.value.type).toBe("progress");
        expect(result.value.content).toBe(validProgressReviewInput.content);
        expect(result.value.reviewerId).toBe(
          validProgressReviewInput.reviewerId,
        );
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should successfully create final review when OKR owner creates it", async () => {
      // Act
      const result = await createReview(context, validFinalReviewInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.okrId).toBe(validFinalReviewInput.okrId);
        expect(result.value.type).toBe("final");
        expect(result.value.content).toBe(validFinalReviewInput.content);
        expect(result.value.reviewerId).toBe(validFinalReviewInput.reviewerId);
      }
    });

    it("should allow admin to create review for any OKR", async () => {
      // Arrange
      const input = {
        ...validFinalReviewInput,
        reviewerId: adminMember.userId, // Admin reviewing someone else's OKR
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.reviewerId).toBe(adminMember.userId);
      }
    });

    it("should allow both progress and final review types", async () => {
      // Act
      const progressResult = await createReview(
        context,
        validProgressReviewInput,
      );
      const finalResult = await createReview(context, validFinalReviewInput);

      // Assert
      expect(progressResult.isOk()).toBe(true);
      expect(finalResult.isOk()).toBe(true);
      if (progressResult.isOk() && finalResult.isOk()) {
        expect(progressResult.value.type).toBe("progress");
        expect(finalResult.value.type).toBe("final");
      }
    });
  });

  describe("authorization checks", () => {
    it("should reject review creation by regular member who is not OKR owner", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput,
        reviewerId: regularMember.userId, // Not admin, not owner
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Permission denied: only OKR owner or team admin can create reviews",
        );
      }
    });

    it("should reject review creation by viewer", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput,
        reviewerId: viewer.userId,
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Permission denied: only OKR owner or team admin can create reviews",
        );
      }
    });

    it("should reject review creation by non-team member", async () => {
      // Arrange
      const nonMemberId = userIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440999",
      );
      const input = {
        ...validProgressReviewInput,
        reviewerId: nonMemberId,
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User is not a team member");
      }
    });

    it("should reject when owner tries to review other's OKR", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput, // Team OKR owned by admin
        reviewerId: okrOwner.userId, // Different user trying to review
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Permission denied: only OKR owner or team admin can create reviews",
        );
      }
    });
  });

  describe("input validation", () => {
    it("should reject empty content", async () => {
      // Arrange
      const invalidInput = {
        ...validProgressReviewInput,
        content: "",
      };

      // Act
      const result = await createReview(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid review input");
      }
    });

    it("should reject content that is too long", async () => {
      // Arrange
      const invalidInput = {
        ...validProgressReviewInput,
        content: "a".repeat(2001), // 2001 characters, exceeds max of 2000
      };

      // Act
      const result = await createReview(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid review input");
      }
    });

    it("should reject invalid review type", async () => {
      // Arrange
      const invalidInput = {
        ...validProgressReviewInput,
        type: "invalid" as "progress" | "final",
      };

      // Act
      const result = await createReview(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid review input");
      }
    });

    it("should reject invalid OKR ID format", async () => {
      // Arrange
      const invalidInput = {
        ...validProgressReviewInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        okrId: "invalid-uuid" as any,
      };

      // Act
      const result = await createReview(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid review input");
      }
    });

    it("should reject invalid reviewer ID format", async () => {
      // Arrange
      const invalidInput = {
        ...validProgressReviewInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        reviewerId: "invalid-uuid" as any,
      };

      // Act
      const result = await createReview(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid review input");
      }
    });

    it("should reject missing required fields", async () => {
      // Arrange
      const invalidInput = {
        okrId: validProgressReviewInput.okrId,
        type: validProgressReviewInput.type,
        // Missing content and reviewerId
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      } as any;

      // Act
      const result = await createReview(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid review input");
      }
    });
  });

  describe("entity validation", () => {
    it("should reject review for non-existent OKR", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput,
        okrId: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440999"),
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("OKR not found");
      }
    });
  });

  describe("repository errors", () => {
    it("should handle OKR repository get failure", async () => {
      // Arrange
      mockOkrRepository.setShouldFailGetById(
        true,
        "Database connection failed",
      );

      // Act
      const result = await createReview(context, validProgressReviewInput);

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
      const result = await createReview(context, validProgressReviewInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to check team membership");
      }
    });

    it("should handle review repository creation failure", async () => {
      // Arrange
      mockReviewRepository.setShouldFailCreate(true, "Failed to create review");

      // Act
      const result = await createReview(context, validProgressReviewInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to create review");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle OKR without owner (only admin can review)", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput,
        okrId: okrWithoutOwner.id,
        reviewerId: adminMember.userId, // Admin can review
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.okrId).toBe(okrWithoutOwner.id);
      }
    });

    it("should reject review of ownerless OKR by non-admin", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput,
        okrId: okrWithoutOwner.id,
        reviewerId: regularMember.userId, // Non-admin can't review
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Permission denied: only OKR owner or team admin can create reviews",
        );
      }
    });

    it("should handle maximum length content", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput,
        content: "a".repeat(2000), // Exactly 2000 characters
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content.length).toBe(2000);
      }
    });

    it("should handle content with special characters and formatting", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput,
        content:
          "Review with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?\n\nLine breaks and unicode: 📈 📊 🎯",
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content).toBe(input.content);
      }
    });

    it("should handle very short but valid content", async () => {
      // Arrange
      const input = {
        ...validProgressReviewInput,
        content: "Good!", // Minimal valid content
      };

      // Act
      const result = await createReview(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content).toBe("Good!");
      }
    });
  });

  describe("business logic validation", () => {
    it("should allow multiple reviews for same OKR", async () => {
      // Arrange
      const review1Input = { ...validProgressReviewInput };
      const review2Input = {
        ...validProgressReviewInput,
        type: "final" as const,
        content: "Final review for the same OKR",
      };

      // Act
      const result1 = await createReview(context, review1Input);
      const result2 = await createReview(context, review2Input);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.id).not.toBe(result2.value.id);
        expect(result1.value.type).toBe("progress");
        expect(result2.value.type).toBe("final");
      }
    });

    it("should allow same reviewer to create multiple reviews", async () => {
      // Arrange
      const review1Input = { ...validProgressReviewInput, okrId: teamOkr.id };
      const review2Input = {
        ...validProgressReviewInput,
        okrId: individualOkr.id,
      };

      // Act
      const result1 = await createReview(context, review1Input);
      const result2 = await createReview(context, review2Input);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.reviewerId).toBe(result2.value.reviewerId);
        expect(result1.value.okrId).not.toBe(result2.value.okrId);
      }
    });
  });
});
