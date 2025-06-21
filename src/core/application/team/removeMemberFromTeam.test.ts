import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import {
  removeMemberFromTeam,
  type RemoveMemberFromTeamInput,
} from "./removeMemberFromTeam";
import type { TeamMember } from "@/core/domain/team/types";

describe("removeMemberFromTeam", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("管理者が他のメンバーを削除できる", async () => {
      const mockAdmin: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );
      mockContext.teamMemberRepository.delete.mockResolvedValue(ok(undefined));

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        targetUserId: "user-member" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).toHaveBeenCalledWith("team-123", "user-admin");
      expect(mockContext.teamMemberRepository.delete).toHaveBeenCalledWith(
        "team-123",
        "user-member",
      );
    });

    it("管理者が viewer を削除できる", async () => {
      const mockAdmin: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );
      mockContext.teamMemberRepository.delete.mockResolvedValue(ok(undefined));

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        targetUserId: "user-viewer" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockContext.teamMemberRepository.delete).toHaveBeenCalledWith(
        "team-123",
        "user-viewer",
      );
    });

    it("管理者が他の管理者を削除できる", async () => {
      const mockAdmin: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-admin1" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );
      mockContext.teamMemberRepository.delete.mockResolvedValue(ok(undefined));

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-admin1" as any,
        targetUserId: "user-admin2" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockContext.teamMemberRepository.delete).toHaveBeenCalledWith(
        "team-123",
        "user-admin2",
      );
    });
  });

  describe("異常系", () => {
    it("無効なteamIdでエラーが返される", async () => {
      const input = {
        teamId: "invalid-team-id",
        userId: "user-admin" as any,
        targetUserId: "user-member" as any,
      } as any;

      const result = await removeMemberFromTeam(mockContext, input);

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
        targetUserId: "user-member" as any,
      } as any;

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("無効なtargetUserIdでエラーが返される", async () => {
      const input = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        targetUserId: "invalid-target-user-id",
      } as any;

      const result = await removeMemberFromTeam(mockContext, input);

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

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        targetUserId: "user-member" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to remove team members",
        );
      }

      expect(mockContext.teamMemberRepository.delete).not.toHaveBeenCalled();
    });

    it("ユーザーが管理者でない場合エラーが返される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-member" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-member" as any,
        targetUserId: "user-other" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to remove team members",
        );
      }

      expect(mockContext.teamMemberRepository.delete).not.toHaveBeenCalled();
    });

    it("viewerが他のメンバーを削除しようとした場合エラーが返される", async () => {
      const mockViewer: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-viewer" as any,
        role: "viewer",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockViewer),
      );

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-viewer" as any,
        targetUserId: "user-member" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to remove team members",
        );
      }
    });

    it("自分自身を削除しようとした場合エラーが返される", async () => {
      const mockAdmin: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        targetUserId: "user-admin" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Cannot remove yourself from the team");
      }

      expect(mockContext.teamMemberRepository.delete).not.toHaveBeenCalled();
    });

    it("メンバー情報の取得でリポジトリエラーが発生した場合エラーが返される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        err(repositoryError),
      );

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        targetUserId: "user-member" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "User is not authorized to remove team members",
        );
      }
    });

    it("メンバー削除でリポジトリエラーが発生した場合エラーが返される", async () => {
      const mockAdmin: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const repositoryError = new RepositoryError("Database connection failed");

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );
      mockContext.teamMemberRepository.delete.mockResolvedValue(
        err(repositoryError),
      );

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        targetUserId: "user-member" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to remove team member");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("必須パラメータが不足している場合エラーが返される", async () => {
      const input = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        // targetUserId missing
      } as any;

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空のオブジェクトが渡された場合エラーが返される", async () => {
      const input = {} as any;

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });
  });

  describe("境界値テスト", () => {
    it("UUID形式のIDで正常に動作する", async () => {
      const mockAdmin: TeamMember = {
        teamId: "550e8400-e29b-41d4-a716-446655440000" as any,
        userId: "550e8400-e29b-41d4-a716-446655440001" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );
      mockContext.teamMemberRepository.delete.mockResolvedValue(ok(undefined));

      const input: RemoveMemberFromTeamInput = {
        teamId: "550e8400-e29b-41d4-a716-446655440000" as any,
        userId: "550e8400-e29b-41d4-a716-446655440001" as any,
        targetUserId: "550e8400-e29b-41d4-a716-446655440002" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440001",
      );
      expect(mockContext.teamMemberRepository.delete).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440002",
      );
    });

    it("同じIDでuserIdとtargetUserIdが同じ場合エラーが返される", async () => {
      const mockAdmin: TeamMember = {
        teamId: "team-123" as any,
        userId: "same-user" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "same-user" as any,
        targetUserId: "same-user" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Cannot remove yourself from the team");
      }

      expect(mockContext.teamMemberRepository.delete).not.toHaveBeenCalled();
    });

    it("存在しないtargetUserIdでもリポジトリ側でエラーハンドリングされる", async () => {
      const mockAdmin: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const repositoryError = new RepositoryError("Target user not found");

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockAdmin),
      );
      mockContext.teamMemberRepository.delete.mockResolvedValue(
        err(repositoryError),
      );

      const input: RemoveMemberFromTeamInput = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        targetUserId: "nonexistent-user" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to remove team member");
        expect(result.error.cause).toBe(repositoryError);
      }
    });
  });
});