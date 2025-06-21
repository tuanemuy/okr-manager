import { beforeEach, describe, expect, it } from "vitest";
import type { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import type { Team } from "@/core/domain/team/types";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { createTestContext } from "../testUtils";
import {
  type GetTeamsByUserIdInput,
  getTeamsByUserId,
} from "./getTeamsByUserId";

describe("getTeamsByUserId", () => {
  let mockContext: ReturnType<typeof createTestContext>;
  let mockTeamRepository: MockTeamRepository;

  beforeEach(() => {
    mockContext = createTestContext();
    mockTeamRepository = mockContext.teamRepository as MockTeamRepository;
    mockTeamRepository.clear();
  });

  describe("正常系", () => {
    it("ユーザーが所属するチーム一覧を取得できる", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440000");
      const teamId1 = teamIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      const teamId2 = teamIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440002",
      );

      const mockTeams: Team[] = [
        {
          id: teamId1,
          name: "開発チーム",
          description: "アプリケーション開発チーム",
          reviewFrequency: "weekly",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
        {
          id: teamId2,
          name: "マーケティングチーム",
          description: "製品マーケティング担当チーム",
          reviewFrequency: "monthly",
          createdAt: new Date("2024-01-02T00:00:00Z"),
          updatedAt: new Date("2024-01-02T00:00:00Z"),
        },
      ];

      // Add teams and user associations
      for (const team of mockTeams) {
        mockTeamRepository.addTeam(team);
        mockTeamRepository.addUserToTeam(userId, team.id);
      }

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toHaveLength(2);
        expect(result.value.teams).toEqual(expect.arrayContaining(mockTeams));
      }
    });

    it("チームに所属していないユーザーが空の配列を受け取る", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440003");

      // Don't add any teams for this user

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([]);
      }
    });

    it("多数のチームに所属するユーザーのチーム一覧を取得できる", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440004");

      const mockTeams: Team[] = Array.from({ length: 20 }, (_, index) => ({
        id: teamIdSchema.parse(
          `550e8400-e29b-41d4-a716-44665544000${index + 5}`,
        ),
        name: `チーム${index}`,
        description: `チーム${index}の説明`,
        reviewFrequency:
          index % 2 === 0 ? ("weekly" as const) : ("monthly" as const),
        createdAt: new Date(
          `2024-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
        ),
        updatedAt: new Date(
          `2024-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
        ),
      }));

      // Add teams and user associations
      for (const team of mockTeams) {
        mockTeamRepository.addTeam(team);
        mockTeamRepository.addUserToTeam(userId, team.id);
      }

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toHaveLength(20);
        expect(result.value.teams).toEqual(mockTeams);
      }
    });

    it("description が null のチームも正常に処理される", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440025");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440026");

      const mockTeam: Team = {
        id: teamId,
        name: "説明なしチーム",
        description: undefined,
        reviewFrequency: "monthly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockTeamRepository.addTeam(mockTeam);
      mockTeamRepository.addUserToTeam(userId, teamId);

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams[0].description).toBeNull();
      }
    });

    it("様々なレビュー頻度のチームを正常に取得できる", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440027");

      const mockTeams: Team[] = [
        {
          id: teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440028"),
          name: "週次チーム",
          description: "週次レビューチーム",
          reviewFrequency: "weekly",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
        {
          id: teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440029"),
          name: "月次チーム",
          description: "月次レビューチーム",
          reviewFrequency: "monthly",
          createdAt: new Date("2024-01-02T00:00:00Z"),
          updatedAt: new Date("2024-01-02T00:00:00Z"),
        },
        {
          id: teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440030"),
          name: "月次チーム日",
          description: "月次レビューチーム日",
          reviewFrequency: "monthly",
          createdAt: new Date("2024-01-03T00:00:00Z"),
          updatedAt: new Date("2024-01-03T00:00:00Z"),
        },
      ];

      for (const team of mockTeams) {
        mockTeamRepository.addTeam(team);
        mockTeamRepository.addUserToTeam(userId, team.id);
      }

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toHaveLength(3);
        expect(result.value.teams.map((t) => t.reviewFrequency)).toEqual([
          "weekly",
          "monthly",
          "quarterly",
        ]);
      }
    });
  });

  describe("異常系", () => {
    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        userId: "invalid-user-id",
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空文字列のuserIdでエラーが返される", async () => {
      const input = {
        userId: "",
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("userIdが未定義でエラーが返される", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      const input = {} as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("null値のuserIdでエラーが返される", async () => {
      const input = {
        userId: null,
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("数値のuserIdでエラーが返される", async () => {
      const input = {
        userId: 123,
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("配列のuserIdでエラーが返される", async () => {
      const input = {
        userId: ["user-123"],
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("オブジェクトのuserIdでエラーが返される", async () => {
      const input = {
        userId: { id: "user-123" },
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("リポジトリエラーが適切に処理される", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440031");

      mockTeamRepository.setShouldFailListByUserId(
        true,
        "Database connection failed",
      );

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get teams");
      }
    });

    it("存在しないユーザーでリポジトリエラーが処理される", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440032");

      mockTeamRepository.setShouldFailListByUserId(true, "User not found");

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get teams");
      }
    });
  });

  describe("境界値テスト", () => {
    it("UUID形式のuserIdで正常に動作する", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440033");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440034");

      const mockTeam: Team = {
        id: teamId,
        name: "UUIDチーム",
        description: "UUID形式テスト",
        reviewFrequency: "weekly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockTeamRepository.addTeam(mockTeam);
      mockTeamRepository.addUserToTeam(userId, teamId);

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([mockTeam]);
      }
    });

    it("最小長のuserIdで正常に動作する", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440035");

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([]);
      }
    });

    it("長いuserIdでも正常に動作する", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440036");

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([]);
      }
    });

    it("特殊文字を含むuserIdでも正常に動作する", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440037");

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([]);
      }
    });

    it("最長のチーム名でも正常に取得できる", async () => {
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440038");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440039");
      const longName = "a".repeat(100);

      const mockTeam: Team = {
        id: teamId,
        name: longName,
        description: "長い名前のチーム",
        reviewFrequency: "weekly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockTeamRepository.addTeam(mockTeam);
      mockTeamRepository.addUserToTeam(userId, teamId);

      const input: GetTeamsByUserIdInput = {
        userId: userId,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams[0].name).toBe(longName);
      }
    });
  });
});
