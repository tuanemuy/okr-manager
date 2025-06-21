import { beforeEach, describe, expect, it } from "vitest";
import type { TeamMember } from "@/core/domain/team/types";
import { ApplicationError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import {
  type RemoveMemberFromTeamInput,
  removeMemberFromTeam,
} from "./removeMemberFromTeam";

describe("removeMemberFromTeam", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("管理者が他のメンバーを削除できる", async () => {
      const mockAdmin: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMember: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-member" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin);
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockMember);

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-member" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // メンバーが削除されたことを確認
      const memberResult =
        await mockContext.teamMemberRepository.getByTeamAndUser(
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "team-123" as any,
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "user-member" as any,
        );
      expect(memberResult.isOk()).toBe(true);
      if (memberResult.isOk()) {
        expect(memberResult.value).toBeNull();
      }
    });

    it("管理者が viewer を削除できる", async () => {
      const mockAdmin: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockViewer: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-viewer" as any,
        role: "viewer",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin);
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockViewer);

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-viewer" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Viewerが削除されたことを確認
      const viewerResult =
        await mockContext.teamMemberRepository.getByTeamAndUser(
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "team-123" as any,
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "user-viewer" as any,
        );
      expect(viewerResult.isOk()).toBe(true);
      if (viewerResult.isOk()) {
        expect(viewerResult.value).toBeNull();
      }
    });

    it("管理者が他の管理者を削除できる", async () => {
      const mockAdmin1: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin1" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockAdmin2: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin2" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin1);
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin2);

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin1" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-admin2" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Admin2が削除されたことを確認
      const admin2Result =
        await mockContext.teamMemberRepository.getByTeamAndUser(
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "team-123" as any,
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "user-admin2" as any,
        );
      expect(admin2Result.isOk()).toBe(true);
      if (admin2Result.isOk()) {
        expect(admin2Result.value).toBeNull();
      }
    });
  });

  describe("異常系", () => {
    it("無効なteamIdでエラーが返される", async () => {
      const input = {
        teamId: "invalid-team-id",
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-member" as any,
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        userId: "invalid-user-id",
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-member" as any,
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
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
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        targetUserId: "invalid-target-user-id",
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("実行者がチームメンバーでない場合エラーが返される", async () => {
      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-outsider" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-member" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User is not a member of this team");
      }
    });

    it("実行者が管理者でない場合エラーが返される", async () => {
      const mockMember: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-member" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTarget: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-target" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockMember);
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockTarget);

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-member" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-target" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "Only admins can remove team members",
        );
      }
    });

    it("削除対象のユーザーがチームメンバーでない場合エラーが返される", async () => {
      const mockAdmin: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin);

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-nonmember" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "Target user is not a member of this team",
        );
      }
    });

    it("自分自身を削除しようとした場合エラーが返される", async () => {
      const mockAdmin: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin);

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-admin" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "Cannot remove yourself from the team",
        );
      }
    });

    it("削除に失敗した場合エラーが返される", async () => {
      const mockAdmin: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMember: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-member" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin);
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockMember);

      // 削除を失敗するように設定
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).setShouldFailDelete(
        true,
        "Delete operation failed",
      );

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-member" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to remove team member");
      }
    });

    it("必須パラメータが不足している場合エラーが返される", async () => {
      const input = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        // targetUserId missing
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空のオブジェクトが渡された場合エラーが返される", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
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
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "550e8400-e29b-41d4-a716-446655440000" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "550e8400-e29b-41d4-a716-446655440001" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMember: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "550e8400-e29b-41d4-a716-446655440000" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "550e8400-e29b-41d4-a716-446655440002" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin);
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockMember);

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "550e8400-e29b-41d4-a716-446655440000" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "550e8400-e29b-41d4-a716-446655440001" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "550e8400-e29b-41d4-a716-446655440002" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("複数のメンバーがいるチームで一人だけ削除できる", async () => {
      const mockAdmin: TeamMember = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const members = Array.from({ length: 5 }, (_, i) => ({
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: `user-member-${i}` as any,
        role: "member" as const,
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      }));

      // MockRepositoryにテストデータを追加
      // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
      (mockContext.teamMemberRepository as any).addMember(mockAdmin);
      for (const member of members) {
        // biome-ignore lint/suspicious/noExplicitAny: モックオブジェクトのメソッドアクセス
        (mockContext.teamMemberRepository as any).addMember(member);
      }

      const input: RemoveMemberFromTeamInput = {
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        teamId: "team-123" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        userId: "user-admin" as any,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
        targetUserId: "user-member-2" as any,
      };

      const result = await removeMemberFromTeam(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // 削除されたメンバーが存在しないことを確認
      const deletedMemberResult =
        await mockContext.teamMemberRepository.getByTeamAndUser(
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "team-123" as any,
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "user-member-2" as any,
        );
      expect(deletedMemberResult.isOk()).toBe(true);
      if (deletedMemberResult.isOk()) {
        expect(deletedMemberResult.value).toBeNull();
      }

      // 他のメンバーが残っていることを確認
      const remainingMemberResult =
        await mockContext.teamMemberRepository.getByTeamAndUser(
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "team-123" as any,
          // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
          "user-member-1" as any,
        );
      expect(remainingMemberResult.isOk()).toBe(true);
      if (remainingMemberResult.isOk()) {
        expect(remainingMemberResult.value).not.toBeNull();
      }
    });
  });
});
