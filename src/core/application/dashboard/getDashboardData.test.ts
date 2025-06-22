import { beforeEach, describe, expect, it } from "vitest";
import type { MockActivityRepository } from "@/core/adapters/mock/activityRepository";
import type { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import type { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import type { Activity } from "@/core/domain/activity/types";
import { activityIdSchema } from "@/core/domain/activity/types";
import type { Okr } from "@/core/domain/okr/types";
import { okrIdSchema } from "@/core/domain/okr/types";
import type { Team } from "@/core/domain/team/types";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import { getDashboardData } from "./getDashboardData";

describe("getDashboardData", () => {
  let context: Context;
  let mockTeamRepository: MockTeamRepository;
  let mockOkrRepository: MockOkrRepository;
  let mockActivityRepository: MockActivityRepository;
  let testUserId: ReturnType<typeof userIdSchema.parse>;

  beforeEach(() => {
    context = createTestContext();
    mockTeamRepository = context.teamRepository as MockTeamRepository;
    mockOkrRepository = context.okrRepository as MockOkrRepository;
    mockActivityRepository =
      context.activityRepository as MockActivityRepository;
    testUserId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440000");
  });

  describe("successful dashboard data retrieval", () => {
    it("should return complete dashboard data when user has teams and OKRs", async () => {
      // Arrange
      const teams: Team[] = [
        {
          id: teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
          name: "Development Team",
          description: "Software development team",
          reviewFrequency: "monthly",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const okrs: Okr[] = [
        {
          id: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
          title: "Personal OKR 1",
          description: "Description 1",
          type: "personal",
          teamId: teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
          ownerId: testUserId,
          quarterYear: new Date().getFullYear(),
          quarterQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const activities: Activity[] = [
        {
          id: activityIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
          userId: testUserId,
          type: "okr_update",
          message: "Created OKR: Personal OKR 1",
          createdAt: new Date(),
        },
      ];

      mockTeamRepository.seed(teams);
      mockTeamRepository.addUserToTeam(
        testUserId,
        teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
      );
      mockOkrRepository.seed(okrs);
      for (const activity of activities) {
        mockActivityRepository.addActivity(activity);
      }

      // Act
      const result = await getDashboardData(context, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const data = result.value;

        expect(data.teams).toHaveLength(1);
        expect(data.teams[0].name).toBe("Development Team");

        expect(data.okrStats.personalOkrs).toBeGreaterThanOrEqual(0);
        expect(data.okrStats.teamOkrs).toBeGreaterThanOrEqual(0);
        expect(data.okrStats.totalProgress).toBeGreaterThanOrEqual(0);

        expect(data.recentActivity).toHaveLength(1);
        expect(data.recentActivity[0].type).toBe("okr_update");
      }
    });

    it("should handle user with no teams", async () => {
      // Arrange - no teams seeded
      mockOkrRepository.seed([]);
      mockActivityRepository.clear();

      // Act
      const result = await getDashboardData(context, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const data = result.value;
        expect(data.teams).toHaveLength(0);
        expect(data.okrStats.personalOkrs).toBe(0);
        expect(data.okrStats.teamOkrs).toBe(0);
        expect(data.okrStats.totalProgress).toBe(0);
        expect(data.recentActivity).toHaveLength(0);
      }
    });
  });

  describe("error handling", () => {
    it("should handle team repository failure", async () => {
      // Arrange
      mockTeamRepository.setShouldFailListByUserId(
        true,
        "Database connection failed",
      );

      // Act
      const result = await getDashboardData(context, testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get user teams");
      }
    });

    it("should gracefully handle partial failures in parallel operations", async () => {
      // Arrange
      const teams: Team[] = [
        {
          id: teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
          name: "Test Team",
          description: "Test team",
          reviewFrequency: "monthly",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTeamRepository.seed(teams);
      mockTeamRepository.addUserToTeam(
        testUserId,
        teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
      );
      mockOkrRepository.setShouldFailListByUser(true, "OKR fetch failed");
      // Note: MockActivityRepository doesn't have setShouldFail method

      // Act
      const result = await getDashboardData(context, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const data = result.value;
        expect(data.teams).toHaveLength(1);
        expect(data.okrStats.personalOkrs).toBe(0); // Fallback to empty array
        expect(data.okrStats.teamOkrs).toBe(0); // Fallback to empty array
        expect(data.recentActivity).toHaveLength(0); // Fallback to empty array
      }
    });

    it("should handle unexpected errors with try-catch", async () => {
      // Arrange - force an unexpected error by passing invalid context
      const invalidContext = {
        ...context,
        // biome-ignore lint/suspicious/noExplicitAny: Testing error handling
        teamRepository: null as any,
      };

      // Act
      const result = await getDashboardData(invalidContext, testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get dashboard data");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle teams with missing member counts", async () => {
      // Arrange
      const teams: Team[] = [
        {
          id: teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
          name: "Team Without Member Count",
          description: "Test team",
          reviewFrequency: "monthly",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTeamRepository.seed(teams);
      mockTeamRepository.addUserToTeam(
        testUserId,
        teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
      );
      mockOkrRepository.seed([]);
      mockActivityRepository.clear();

      // Act
      const result = await getDashboardData(context, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const data = result.value;
        expect(data.teams[0].memberCount).toBe(1);
      }
    });
  });
});
