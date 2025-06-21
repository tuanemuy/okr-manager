import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import { deleteTeam, type DeleteTeamInput } from "./deleteTeam";
import type { TeamMember } from "@/core/domain/team/types";

describe("deleteTeam", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("管理者が最後のメンバーの場合、チームを削除できる", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMembersList = {
        items: [mockMember],
        count: 1,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(
        ok(mockMembersList),
      );
      mockContext.teamRepository.delete.mockResolvedValue(ok(undefined));

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).toHaveBeenCalledWith("team-123", "user-123");
      expect(mockContext.teamMemberRepository.list).toHaveBeenCalledWith({
        teamId: "team-123",
        pagination: { page: 1, limit: 100, order: "asc", orderBy: "joinedAt" },
      });
      expect(mockContext.teamRepository.delete).toHaveBeenCalledWith("team-123");
    });
  });

  describe("異常系", () => {
    it("無効なteamIdでエラーが返される", async () => {
      const input = {
        teamId: "invalid-team-id",
        userId: "user-123" as any,
      } as any;

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).not.toHaveBeenCalled();
    });

    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        teamId: "team-123" as any,
        userId: "invalid-user-id",
      } as any;

      const result = await deleteTeam(mockContext, input);

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

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to delete this team",
        );
      }
    });

    it("ユーザーが管理者でない場合エラーが返される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to delete this team",
        );
      }
    });

    it("他のメンバーが存在する場合エラーが返される", async () => {
      const mockAdmin: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-456" as any,
        role: "member",
        joinedAt: new Date("2024-01-02T00:00:00Z"),
      };

      const mockMembersList = {
        items: [mockAdmin, mockMember],
        count: 2,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(
        ok(mockMembersList),
      );

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Cannot delete team with other members");
      }

      expect(mockContext.teamRepository.delete).not.toHaveBeenCalled();
    });

    it("メンバー情報の取得でリポジトリエラーが発生した場合エラーが返される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        err(repositoryError),
      );

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to delete this team",
        );
      }
    });

    it("メンバーリストの取得でリポジトリエラーが発生した場合エラーが返される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const repositoryError = new RepositoryError("Database connection failed");

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(
        err(repositoryError),
      );

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to check team members");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("チーム削除でリポジトリエラーが発生した場合エラーが返される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMembersList = {
        items: [mockMember],
        count: 1,
      };

      const repositoryError = new RepositoryError("Database connection failed");

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(
        ok(mockMembersList),
      );
      mockContext.teamRepository.delete.mockResolvedValue(err(repositoryError));

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to delete team");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("必須パラメータが不足している場合エラーが返される", async () => {
      const input = {
        teamId: "team-123" as any,
        // userId missing
      } as any;

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空のオブジェクトが渡された場合エラーが返される", async () => {
      const input = {} as any;

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });
  });

  describe("境界値テスト", () => {
    it("viewerロールのユーザーは削除できない", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "viewer",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to delete this team",
        );
      }
    });

    it("管理者が複数いる場合でも他のメンバーがいれば削除できない", async () => {
      const mockAdmin1: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockAdmin2: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-456" as any,
        role: "admin",
        joinedAt: new Date("2024-01-02T00:00:00Z"),
      };

      const mockMembersList = {
        items: [mockAdmin1, mockAdmin2],
        count: 2,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin1),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(
        ok(mockMembersList),
      );

      const input: DeleteTeamInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Cannot delete team with other members");
      }
    });
  });
});