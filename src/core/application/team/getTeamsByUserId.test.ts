import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import { getTeamsByUserId, type GetTeamsByUserIdInput } from "./getTeamsByUserId";
import type { Team } from "@/core/domain/team/types";

describe("getTeamsByUserId", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("ユーザーが所属するチーム一覧を取得できる", async () => {
      const mockTeams: Team[] = [
        {
          id: "team-123" as any,
          name: "開発チーム",
          description: "アプリケーション開発チーム",
          reviewFrequency: "weekly",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
        {
          id: "team-456" as any,
          name: "マーケティングチーム",
          description: "製品マーケティング担当チーム",
          reviewFrequency: "monthly",
          createdAt: new Date("2024-01-02T00:00:00Z"),
          updatedAt: new Date("2024-01-02T00:00:00Z"),
        },
      ];

      mockContext.teamRepository.listByUserId.mockResolvedValue(ok(mockTeams));

      const input: GetTeamsByUserIdInput = {
        userId: "user-123" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual(mockTeams);
      }

      expect(mockContext.teamRepository.listByUserId).toHaveBeenCalledWith(
        "user-123",
      );
    });

    it("チームに所属していないユーザーが空の配列を受け取る", async () => {
      mockContext.teamRepository.listByUserId.mockResolvedValue(ok([]));

      const input: GetTeamsByUserIdInput = {
        userId: "user-123" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([]);
      }

      expect(mockContext.teamRepository.listByUserId).toHaveBeenCalledWith(
        "user-123",
      );
    });

    it("多数のチームに所属するユーザーのチーム一覧を取得できる", async () => {
      const mockTeams: Team[] = Array.from({ length: 20 }, (_, index) => ({
        id: `team-${index}` as any,
        name: `チーム${index}`,
        description: `チーム${index}の説明`,
        reviewFrequency: index % 2 === 0 ? ("weekly" as const) : ("monthly" as const),
        createdAt: new Date(`2024-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`),
        updatedAt: new Date(`2024-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`),
      }));

      mockContext.teamRepository.listByUserId.mockResolvedValue(ok(mockTeams));

      const input: GetTeamsByUserIdInput = {
        userId: "user-123" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toHaveLength(20);
        expect(result.value.teams).toEqual(mockTeams);
      }
    });

    it("description が null のチームも正常に処理される", async () => {
      const mockTeams: Team[] = [
        {
          id: "team-123" as any,
          name: "説明なしチーム",
          description: null,
          reviewFrequency: "quarterly",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
      ];

      mockContext.teamRepository.listByUserId.mockResolvedValue(ok(mockTeams));

      const input: GetTeamsByUserIdInput = {
        userId: "user-123" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams[0].description).toBeNull();
      }
    });

    it("様々なレビュー頻度のチームを正常に取得できる", async () => {
      const mockTeams: Team[] = [
        {
          id: "team-weekly" as any,
          name: "週次チーム",
          description: "週次レビューチーム",
          reviewFrequency: "weekly",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
        {
          id: "team-monthly" as any,
          name: "月次チーム",
          description: "月次レビューチーム",
          reviewFrequency: "monthly",
          createdAt: new Date("2024-01-02T00:00:00Z"),
          updatedAt: new Date("2024-01-02T00:00:00Z"),
        },
        {
          id: "team-quarterly" as any,
          name: "四半期チーム",
          description: "四半期レビューチーム",
          reviewFrequency: "quarterly",
          createdAt: new Date("2024-01-03T00:00:00Z"),
          updatedAt: new Date("2024-01-03T00:00:00Z"),
        },
      ];

      mockContext.teamRepository.listByUserId.mockResolvedValue(ok(mockTeams));

      const input: GetTeamsByUserIdInput = {
        userId: "user-123" as any,
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
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockContext.teamRepository.listByUserId).not.toHaveBeenCalled();
    });

    it("空文字列のuserIdでエラーが返される", async () => {
      const input = {
        userId: "",
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("userIdが未定義でエラーが返される", async () => {
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
      } as any;

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("リポジトリエラーが適切に処理される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.teamRepository.listByUserId.mockResolvedValue(
        err(repositoryError),
      );

      const input: GetTeamsByUserIdInput = {
        userId: "user-123" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get teams");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("存在しないユーザーでリポジトリエラーが処理される", async () => {
      const repositoryError = new RepositoryError("User not found");
      mockContext.teamRepository.listByUserId.mockResolvedValue(
        err(repositoryError),
      );

      const input: GetTeamsByUserIdInput = {
        userId: "nonexistent-user" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get teams");
        expect(result.error.cause).toBe(repositoryError);
      }
    });
  });

  describe("境界値テスト", () => {
    it("UUID形式のuserIdで正常に動作する", async () => {
      const mockTeams: Team[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000" as any,
          name: "UUIDチーム",
          description: "UUID形式テスト",
          reviewFrequency: "weekly",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
      ];

      mockContext.teamRepository.listByUserId.mockResolvedValue(ok(mockTeams));

      const input: GetTeamsByUserIdInput = {
        userId: "550e8400-e29b-41d4-a716-446655440001" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual(mockTeams);
      }

      expect(mockContext.teamRepository.listByUserId).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440001",
      );
    });

    it("最小長のuserIdで正常に動作する", async () => {
      mockContext.teamRepository.listByUserId.mockResolvedValue(ok([]));

      const input: GetTeamsByUserIdInput = {
        userId: "u" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([]);
      }

      expect(mockContext.teamRepository.listByUserId).toHaveBeenCalledWith("u");
    });

    it("長いuserIdでも正常に動作する", async () => {
      const longUserId = "user-" + "a".repeat(100);
      mockContext.teamRepository.listByUserId.mockResolvedValue(ok([]));

      const input: GetTeamsByUserIdInput = {
        userId: longUserId as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([]);
      }

      expect(mockContext.teamRepository.listByUserId).toHaveBeenCalledWith(
        longUserId,
      );
    });

    it("特殊文字を含むuserIdでも正常に動作する", async () => {
      const specialUserId = "user-123_@#$";
      mockContext.teamRepository.listByUserId.mockResolvedValue(ok([]));

      const input: GetTeamsByUserIdInput = {
        userId: specialUserId as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams).toEqual([]);
      }

      expect(mockContext.teamRepository.listByUserId).toHaveBeenCalledWith(
        specialUserId,
      );
    });

    it("最長のチーム名でも正常に取得できる", async () => {
      const longName = "a".repeat(100);
      const mockTeams: Team[] = [
        {
          id: "team-123" as any,
          name: longName,
          description: "長い名前のチーム",
          reviewFrequency: "weekly",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
      ];

      mockContext.teamRepository.listByUserId.mockResolvedValue(ok(mockTeams));

      const input: GetTeamsByUserIdInput = {
        userId: "user-123" as any,
      };

      const result = await getTeamsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.teams[0].name).toBe(longName);
      }
    });
  });
});