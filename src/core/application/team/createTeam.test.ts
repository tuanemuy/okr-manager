import type { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import type { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { beforeEach, describe, expect, it } from "vitest";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import { type CreateTeamInput, createTeam } from "./createTeam";

describe("createTeam", () => {
  let context: Context;
  let mockTeamRepository: MockTeamRepository;
  let mockTeamMemberRepository: MockTeamMemberRepository;
  let validInput: CreateTeamInput;

  beforeEach(() => {
    context = createTestContext();
    mockTeamRepository = context.teamRepository as MockTeamRepository;
    mockTeamMemberRepository =
      context.teamMemberRepository as MockTeamMemberRepository;

    validInput = {
      name: "Development Team",
      description: "A team for software development",
      ownerId: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440000"),
    };
  });

  describe("successful team creation", () => {
    it("should successfully create a team with valid input", async () => {
      // Act
      const result = await createTeam(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(validInput.name);
        expect(result.value.description).toBe(validInput.description);
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should create team and add owner as admin member", async () => {
      // Act
      const result = await createTeam(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const team = result.value;

        // Verify team member was created
        const memberResult = await mockTeamMemberRepository.getByTeamAndUser(
          team.id,
          validInput.ownerId,
        );
        expect(memberResult.isOk()).toBe(true);
        if (memberResult.isOk() && memberResult.value) {
          expect(memberResult.value.role).toBe("admin");
          expect(memberResult.value.teamId).toBe(team.id);
          expect(memberResult.value.userId).toBe(validInput.ownerId);
        }
      }
    });

    it("should create team without description", async () => {
      // Arrange
      const inputWithoutDescription = {
        name: "Simple Team",
        ownerId: validInput.ownerId,
      };

      // Act
      const result = await createTeam(context, inputWithoutDescription);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(inputWithoutDescription.name);
        expect(result.value.description).toBeUndefined();
      }
    });
  });

  describe("input validation", () => {
    it("should reject empty team name", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        name: "",
      };

      // Act
      const result = await createTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid team input");
      }
    });

    it("should reject team name that is too long", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        name: "a".repeat(101), // 101 characters, exceeds max of 100
      };

      // Act
      const result = await createTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid team input");
      }
    });

    it("should reject description that is too long", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        description: "a".repeat(501), // 501 characters, exceeds max of 500
      };

      // Act
      const result = await createTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid team input");
      }
    });

    it("should reject invalid owner ID format", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        ownerId: "invalid-uuid" as any,
      };

      // Act
      const result = await createTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid team input");
      }
    });

    it("should reject missing required fields", async () => {
      // Arrange
      const invalidInput = {
        description: "Missing name and owner",
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      } as any;

      // Act
      const result = await createTeam(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid team input");
      }
    });
  });

  describe("repository errors", () => {
    it("should handle team repository creation failure", async () => {
      // Arrange
      mockTeamRepository.setShouldFailCreate(
        true,
        "Database connection failed",
      );

      // Act
      const result = await createTeam(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to create team");
      }
    });

    it("should handle team member repository creation failure", async () => {
      // Arrange
      mockTeamMemberRepository.setShouldFailCreate(
        true,
        "Failed to add member",
      );

      // Act
      const result = await createTeam(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Failed to add team creator as admin",
        );
      }
    });
  });

  describe("business logic validation", () => {
    it("should create teams with unique names for same owner", async () => {
      // Arrange
      const team1Input = { ...validInput, name: "Team Alpha" };
      const team2Input = { ...validInput, name: "Team Beta" };

      // Act
      const result1 = await createTeam(context, team1Input);
      const result2 = await createTeam(context, team2Input);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.id).not.toBe(result2.value.id);
        expect(result1.value.name).toBe("Team Alpha");
        expect(result2.value.name).toBe("Team Beta");
      }
    });

    it("should allow multiple owners to create teams with same name", async () => {
      // Arrange
      const owner1Id = userIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      const owner2Id = userIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440002",
      );

      const team1Input = { ...validInput, ownerId: owner1Id };
      const team2Input = { ...validInput, ownerId: owner2Id };

      // Act
      const result1 = await createTeam(context, team1Input);
      const result2 = await createTeam(context, team2Input);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.name).toBe(result2.value.name);
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle team name with special characters", async () => {
      // Arrange
      const specialNameInput = {
        ...validInput,
        name: "Team @#$%^&*() - Special Chars!",
      };

      // Act
      const result = await createTeam(context, specialNameInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(specialNameInput.name);
      }
    });

    it("should handle team name with unicode characters", async () => {
      // Arrange
      const unicodeNameInput = {
        ...validInput,
        name: "チーム開発 🚀 Team Development",
      };

      // Act
      const result = await createTeam(context, unicodeNameInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(unicodeNameInput.name);
      }
    });

    it("should handle maximum length team name", async () => {
      // Arrange
      const maxLengthInput = {
        ...validInput,
        name: "a".repeat(100), // Exactly 100 characters
      };

      // Act
      const result = await createTeam(context, maxLengthInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(maxLengthInput.name);
        expect(result.value.name.length).toBe(100);
      }
    });

    it("should handle maximum length description", async () => {
      // Arrange
      const maxDescriptionInput = {
        ...validInput,
        description: "a".repeat(500), // Exactly 500 characters
      };

      // Act
      const result = await createTeam(context, maxDescriptionInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe(maxDescriptionInput.description);
        expect(result.value.description?.length).toBe(500);
      }
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent team creation by same owner", async () => {
      // Arrange
      const concurrentInputs = [
        { ...validInput, name: "Concurrent Team 1" },
        { ...validInput, name: "Concurrent Team 2" },
        { ...validInput, name: "Concurrent Team 3" },
      ];

      // Act
      const results = await Promise.all(
        concurrentInputs.map((input) => createTeam(context, input)),
      );

      // Assert
      for (const [index, result] of results.entries()) {
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.name).toBe(concurrentInputs[index].name);
        }
      }

      // Ensure all teams have unique IDs
      const teamIds = results
        .filter((r) => r.isOk())
        .map((r) => (r.isOk() ? r.value.id : null));
      const uniqueIds = new Set(teamIds);
      expect(uniqueIds.size).toBe(teamIds.length);
    });
  });
});
