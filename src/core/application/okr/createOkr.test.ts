import { beforeEach, describe, expect, it } from "vitest";
import type { MockKeyResultRepository } from "@/core/adapters/mock/keyResultRepository";
import type { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import type { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import { type TeamMember, teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import { type CreateOkrInput, createOkr } from "./createOkr";

describe("createOkr", () => {
  let context: Context;
  let mockTeamMemberRepository: MockTeamMemberRepository;
  let mockOkrRepository: MockOkrRepository;
  let mockKeyResultRepository: MockKeyResultRepository;
  let adminMember: TeamMember;
  let regularMember: TeamMember;
  let viewer: TeamMember;
  let validTeamOkrInput: CreateOkrInput;
  let validIndividualOkrInput: CreateOkrInput;

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
    const memberUserId = userIdSchema.parse(
      "550e8400-e29b-41d4-a716-446655440002",
    );
    const viewerUserId = userIdSchema.parse(
      "550e8400-e29b-41d4-a716-446655440003",
    );

    // Set up team members
    adminMember = {
      teamId,
      userId: adminUserId,
      role: "admin",
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

    mockTeamMemberRepository.seed([adminMember, regularMember, viewer]);

    validTeamOkrInput = {
      title: "Improve Development Velocity",
      description: "Increase team productivity and reduce delivery time",
      type: "team",
      teamId,
      ownerId: adminUserId,
      quarter: {
        year: 2024,
        quarter: 2,
      },
      keyResults: [
        {
          title: "Reduce deployment time",
          targetValue: 30,
          unit: "minutes",
        },
        {
          title: "Increase test coverage",
          targetValue: 85,
          unit: "percent",
        },
      ],
    };

    validIndividualOkrInput = {
      title: "Personal Skill Development",
      description: "Enhance technical skills and knowledge",
      type: "personal",
      teamId,
      ownerId: memberUserId,
      quarter: {
        year: 2024,
        quarter: 2,
      },
      keyResults: [
        {
          title: "Complete certification courses",
          targetValue: 3,
          unit: "courses",
        },
      ],
    };
  });

  describe("successful OKR creation", () => {
    it("should successfully create team OKR when admin creates it", async () => {
      // Act
      const result = await createOkr(context, validTeamOkrInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe(validTeamOkrInput.title);
        expect(result.value.description).toBe(validTeamOkrInput.description);
        expect(result.value.type).toBe("team");
        expect(result.value.teamId).toBe(validTeamOkrInput.teamId);
        expect(result.value.ownerId).toBe(validTeamOkrInput.ownerId);
        expect(result.value.quarterYear).toBe(2024);
        expect(result.value.quarterQuarter).toBe(2);
      }
    });

    it("should successfully create individual OKR when member creates it", async () => {
      // Act
      const result = await createOkr(context, validIndividualOkrInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe(validIndividualOkrInput.title);
        expect(result.value.type).toBe("individual");
        expect(result.value.ownerId).toBe(validIndividualOkrInput.ownerId);
      }
    });

    it("should successfully create individual OKR when admin creates it", async () => {
      // Arrange
      const input = {
        ...validIndividualOkrInput,
        ownerId: adminMember.userId,
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("individual");
        expect(result.value.ownerId).toBe(adminMember.userId);
      }
    });

    it("should create all specified key results", async () => {
      // Act
      const result = await createOkr(context, validTeamOkrInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const keyResults = mockKeyResultRepository.getByOkrId(result.value.id);
        expect(keyResults).toHaveLength(2);
        expect(keyResults[0].title).toBe("Reduce deployment time");
        expect(keyResults[0].targetValue).toBe(30);
        expect(keyResults[0].unit).toBe("minutes");
        expect(keyResults[0].currentValue).toBe(0);
        expect(keyResults[1].title).toBe("Increase test coverage");
        expect(keyResults[1].targetValue).toBe(85);
        expect(keyResults[1].unit).toBe("percent");
      }
    });
  });

  describe("authorization checks", () => {
    it("should reject team OKR creation by regular member", async () => {
      // Arrange
      const input = {
        ...validTeamOkrInput,
        ownerId: regularMember.userId,
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Only team admins can create team OKRs",
        );
      }
    });

    it("should reject team OKR creation by viewer", async () => {
      // Arrange
      const input = {
        ...validTeamOkrInput,
        ownerId: viewer.userId,
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Only team admins can create team OKRs",
        );
      }
    });

    it("should reject individual OKR creation by viewer", async () => {
      // Arrange
      const input = {
        ...validIndividualOkrInput,
        ownerId: viewer.userId,
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Only team admins and members can create individual OKRs",
        );
      }
    });

    it("should reject OKR creation by non-team member", async () => {
      // Arrange
      const nonMemberId = userIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440999",
      );
      const input = {
        ...validTeamOkrInput,
        ownerId: nonMemberId,
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Only team admins can create team OKRs",
        );
      }
    });
  });

  describe("input validation", () => {
    it("should reject empty title", async () => {
      // Arrange
      const invalidInput = {
        ...validTeamOkrInput,
        title: "",
      };

      // Act
      const result = await createOkr(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid OKR input");
      }
    });

    it("should reject title that is too long", async () => {
      // Arrange
      const invalidInput = {
        ...validTeamOkrInput,
        title: "a".repeat(201), // 201 characters, exceeds max of 200
      };

      // Act
      const result = await createOkr(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid OKR input");
      }
    });

    it("should reject description that is too long", async () => {
      // Arrange
      const invalidInput = {
        ...validTeamOkrInput,
        description: "a".repeat(1001), // 1001 characters, exceeds max of 1000
      };

      // Act
      const result = await createOkr(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid OKR input");
      }
    });

    it("should reject invalid OKR type", async () => {
      // Arrange
      const invalidInput = {
        ...validTeamOkrInput,
        type: "invalid" as "team" | "personal",
      };

      // Act
      const result = await createOkr(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid OKR input");
      }
    });

    it("should reject invalid quarter values", async () => {
      // Arrange
      const invalidInput = {
        ...validTeamOkrInput,
        quarter: {
          year: 1999, // Below minimum
          quarter: 5, // Above maximum
        },
      };

      // Act
      const result = await createOkr(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid OKR input");
      }
    });

    it("should reject OKR without key results", async () => {
      // Arrange
      const invalidInput = {
        ...validTeamOkrInput,
        keyResults: [],
      };

      // Act
      const result = await createOkr(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid OKR input");
      }
    });

    it("should reject OKR with too many key results", async () => {
      // Arrange
      const invalidInput = {
        ...validTeamOkrInput,
        keyResults: Array(6).fill({
          title: "Key Result",
          targetValue: 100,
          unit: "units",
        }),
      };

      // Act
      const result = await createOkr(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid OKR input");
      }
    });

    it("should reject key results with invalid values", async () => {
      // Arrange
      const invalidInput = {
        ...validTeamOkrInput,
        keyResults: [
          {
            title: "", // Empty title
            targetValue: -1, // Negative target value
            unit: "units",
          },
        ],
      };

      // Act
      const result = await createOkr(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid OKR input");
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
      const result = await createOkr(context, validTeamOkrInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to check team membership");
      }
    });

    it("should handle OKR repository creation failure", async () => {
      // Arrange
      mockOkrRepository.setShouldFailCreate(true, "Failed to create OKR");

      // Act
      const result = await createOkr(context, validTeamOkrInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to create OKR");
      }
    });

    it("should handle key result repository creation failure", async () => {
      // Arrange
      mockKeyResultRepository.setShouldFailCreate(
        true,
        "Failed to create key result",
      );

      // Act
      const result = await createOkr(context, validTeamOkrInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to create key result");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle OKR creation without description", async () => {
      // Arrange
      const input = {
        ...validTeamOkrInput,
        description: undefined,
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBeUndefined();
      }
    });

    it("should handle key results without unit", async () => {
      // Arrange
      const input = {
        ...validTeamOkrInput,
        keyResults: [
          {
            title: "Complete tasks",
            targetValue: 10,
            // No unit specified
          },
        ],
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const keyResults = mockKeyResultRepository.getByOkrId(result.value.id);
        expect(keyResults[0].unit).toBeUndefined();
      }
    });

    it("should handle maximum length title", async () => {
      // Arrange
      const input = {
        ...validTeamOkrInput,
        title: "a".repeat(200), // Exactly 200 characters
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title.length).toBe(200);
      }
    });

    it("should handle maximum quarter values", async () => {
      // Arrange
      const input = {
        ...validTeamOkrInput,
        quarter: {
          year: 3000, // Maximum year
          quarter: 4, // Maximum quarter
        },
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.quarterYear).toBe(3000);
        expect(result.value.quarterQuarter).toBe(4);
      }
    });

    it("should handle maximum number of key results", async () => {
      // Arrange
      const input = {
        ...validTeamOkrInput,
        keyResults: Array(5)
          .fill(null)
          .map((_, index) => ({
            title: `Key Result ${index + 1}`,
            targetValue: 100,
            unit: "units",
          })),
      };

      // Act
      const result = await createOkr(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const keyResults = mockKeyResultRepository.getByOkrId(result.value.id);
        expect(keyResults).toHaveLength(5);
      }
    });
  });

  describe("business logic validation", () => {
    it("should allow multiple OKRs for same team in different quarters", async () => {
      // Arrange
      const okr1Input = {
        ...validTeamOkrInput,
        quarter: { year: 2024, quarter: 1 },
      };
      const okr2Input = {
        ...validTeamOkrInput,
        quarter: { year: 2024, quarter: 2 },
      };

      // Act
      const result1 = await createOkr(context, okr1Input);
      const result2 = await createOkr(context, okr2Input);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });

    it("should allow both team and individual OKRs for same team", async () => {
      // Act
      const teamResult = await createOkr(context, validTeamOkrInput);
      const individualResult = await createOkr(
        context,
        validIndividualOkrInput,
      );

      // Assert
      expect(teamResult.isOk()).toBe(true);
      expect(individualResult.isOk()).toBe(true);
      if (teamResult.isOk() && individualResult.isOk()) {
        expect(teamResult.value.type).toBe("team");
        expect(individualResult.value.type).toBe("individual");
      }
    });
  });
});
