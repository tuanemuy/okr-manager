import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import { getTeamById, type GetTeamByIdInput } from "./getTeamById";
import type { Team, TeamMember } from "@/core/domain/team/types";

describe("getTeamById", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("チームメンバーが有効なチーム情報を取得できる", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeam: Team = {
        id: "team-123" as any,
        name: "テストチーム",
        description: "テスト用のチーム",
        reviewFrequency: "weekly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamRepository.getById.mockResolvedValue(ok(mockTeam));

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockTeam);
      }

      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).toHaveBeenCalledWith("team-123", "user-123");
      expect(mockContext.teamRepository.getById).toHaveBeenCalledWith("team-123");
    });

    it("管理者が有効なチーム情報を取得できる", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeam: Team = {
        id: "team-123" as any,
        name: "管理者チーム",
        description: "管理者専用チーム",
        reviewFrequency: "monthly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamRepository.getById.mockResolvedValue(ok(mockTeam));

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockTeam);
      }
    });

    it("viewerが有効なチーム情報を取得できる", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "viewer",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeam: Team = {
        id: "team-123" as any,
        name: "閲覧専用チーム",
        description: null,
        reviewFrequency: "quarterly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamRepository.getById.mockResolvedValue(ok(mockTeam));

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockTeam);
      }
    });
  });

  describe("異常系", () => {
    it("無効なteamIdでエラーが返される", async () => {
      const input = {
        teamId: "invalid-team-id",
        userId: "user-123" as any,
      } as any;

      const result = await getTeamById(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).not.toHaveBeenCalled();
      expect(mockContext.teamRepository.getById).not.toHaveBeenCalled();
    });

    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        teamId: "team-123" as any,
        userId: "invalid-user-id",
      } as any;

      const result = await getTeamById(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("ユーザーがチームメンバーでない場合エラーが返される", async () => {
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(null),
      );

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User is not a member of this team");
      }

      expect(mockContext.teamRepository.getById).toHaveBeenCalled();
    });

    it("メンバーシップ確認でリポジトリエラーが発生した場合エラーが返される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        err(repositoryError),
      );

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User is not a member of this team");
      }
    });

    it("チーム取得でリポジトリエラーが発生した場合エラーが返される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const repositoryError = new RepositoryError("Database connection failed");

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamRepository.getById.mockResolvedValue(err(repositoryError));

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get team");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("チームが存在しない場合エラーが返される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamRepository.getById.mockResolvedValue(ok(null));

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Team not found");
      }
    });

    it("必須パラメータが不足している場合エラーが返される", async () => {
      const input = {
        teamId: "team-123" as any,
        // userId missing
      } as any;

      const result = await getTeamById(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空のオブジェクトが渡された場合エラーが返される", async () => {
      const input = {} as any;

      const result = await getTeamById(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });
  });

  describe("境界値テスト", () => {
    it("UUID形式のIDで正常に動作する", async () => {
      const mockMember: TeamMember = {
        teamId: "550e8400-e29b-41d4-a716-446655440000" as any,
        userId: "550e8400-e29b-41d4-a716-446655440001" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeam: Team = {
        id: "550e8400-e29b-41d4-a716-446655440000" as any,
        name: "UUIDチーム",
        description: "UUID形式IDのテスト",
        reviewFrequency: "weekly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamRepository.getById.mockResolvedValue(ok(mockTeam));

      const input: GetTeamByIdInput = {
        teamId: "550e8400-e29b-41d4-a716-446655440000" as any,
        userId: "550e8400-e29b-41d4-a716-446655440001" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockTeam);
      }
    });

    it("最長のチーム名でも正常に取得できる", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const longName = "a".repeat(100);
      const mockTeam: Team = {
        id: "team-123" as any,
        name: longName,
        description: "長い名前のチーム",
        reviewFrequency: "weekly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamRepository.getById.mockResolvedValue(ok(mockTeam));

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(longName);
      }
    });

    it("descriptionがnullの場合も正常に処理される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeam: Team = {
        id: "team-123" as any,
        name: "説明なしチーム",
        description: null,
        reviewFrequency: "weekly",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamRepository.getById.mockResolvedValue(ok(mockTeam));

      const input: GetTeamByIdInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamById(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBeNull();
      }
    });
  });
});