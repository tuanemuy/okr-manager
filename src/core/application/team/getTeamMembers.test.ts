import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import { getTeamMembers, type GetTeamMembersInput } from "./getTeamMembers";
import type { TeamMember, TeamMemberWithUser } from "@/core/domain/team/types";

describe("getTeamMembers", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("チームメンバーがメンバー一覧を取得できる", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMembersWithUser: TeamMemberWithUser[] = [
        {
          teamId: "team-123" as any,
          userId: "user-123" as any,
          role: "member",
          joinedAt: new Date("2024-01-01T00:00:00Z"),
          user: {
            id: "user-123" as any,
            email: "user1@example.com",
            displayName: "ユーザー1",
            hashedPassword: "hashed123",
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
        },
        {
          teamId: "team-123" as any,
          userId: "user-456" as any,
          role: "admin",
          joinedAt: new Date("2024-01-02T00:00:00Z"),
          user: {
            id: "user-456" as any,
            email: "admin@example.com",
            displayName: "管理者",
            hashedPassword: "hashed456",
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
        },
      ];

      const mockResult = {
        items: mockMembersWithUser,
        count: 2,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(ok(mockResult));

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toEqual(mockMembersWithUser);
        expect(result.value.totalCount).toBe(2);
      }

      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).toHaveBeenCalledWith("team-123", "user-123");
      expect(mockContext.teamMemberRepository.list).toHaveBeenCalledWith({
        teamId: "team-123",
        pagination: { page: 1, limit: 100, order: "asc", orderBy: "joinedAt" },
      });
    });

    it("管理者がメンバー一覧を取得できる", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockResult = {
        items: [],
        count: 0,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(ok(mockResult));

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toEqual([]);
        expect(result.value.totalCount).toBe(0);
      }
    });

    it("viewerがメンバー一覧を取得できる", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "viewer",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMembersWithUser: TeamMemberWithUser[] = [
        {
          teamId: "team-123" as any,
          userId: "user-123" as any,
          role: "viewer",
          joinedAt: new Date("2024-01-01T00:00:00Z"),
          user: {
            id: "user-123" as any,
            email: "viewer@example.com",
            displayName: "閲覧者",
            hashedPassword: "hashed123",
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
        },
      ];

      const mockResult = {
        items: mockMembersWithUser,
        count: 1,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(ok(mockResult));

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toEqual(mockMembersWithUser);
        expect(result.value.totalCount).toBe(1);
      }
    });

    it("大量のメンバーがいる場合も正常に処理される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMembersWithUser: TeamMemberWithUser[] = Array.from(
        { length: 50 },
        (_, index) => ({
          teamId: "team-123" as any,
          userId: `user-${index}` as any,
          role: index === 0 ? ("admin" as const) : ("member" as const),
          joinedAt: new Date(`2024-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`),
          user: {
            id: `user-${index}` as any,
            email: `user${index}@example.com`,
            displayName: `ユーザー${index}`,
            hashedPassword: `hashed${index}`,
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
        }),
      );

      const mockResult = {
        items: mockMembersWithUser,
        count: 50,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(ok(mockResult));

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toHaveLength(50);
        expect(result.value.totalCount).toBe(50);
      }
    });
  });

  describe("異常系", () => {
    it("無効なteamIdでエラーが返される", async () => {
      const input = {
        teamId: "invalid-team-id",
        userId: "user-123" as any,
      } as any;

      const result = await getTeamMembers(mockContext, input);

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

      const result = await getTeamMembers(mockContext, input);

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

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User is not a member of this team");
      }

      expect(mockContext.teamMemberRepository.list).not.toHaveBeenCalled();
    });

    it("メンバーシップ確認でリポジトリエラーが発生した場合エラーが返される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        err(repositoryError),
      );

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User is not a member of this team");
      }
    });

    it("メンバー一覧の取得でリポジトリエラーが発生した場合エラーが返される", async () => {
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
      mockContext.teamMemberRepository.list.mockResolvedValue(
        err(repositoryError),
      );

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get team members");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("必須パラメータが不足している場合エラーが返される", async () => {
      const input = {
        teamId: "team-123" as any,
        // userId missing
      } as any;

      const result = await getTeamMembers(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空のオブジェクトが渡された場合エラーが返される", async () => {
      const input = {} as any;

      const result = await getTeamMembers(mockContext, input);

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

      const mockResult = {
        items: [],
        count: 0,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(ok(mockResult));

      const input: GetTeamMembersInput = {
        teamId: "550e8400-e29b-41d4-a716-446655440000" as any,
        userId: "550e8400-e29b-41d4-a716-446655440001" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toEqual([]);
        expect(result.value.totalCount).toBe(0);
      }
    });

    it("メンバーが100人の限界値でも正常に処理される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMembersWithUser: TeamMemberWithUser[] = [];
      const mockResult = {
        items: mockMembersWithUser,
        count: 100,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(ok(mockResult));

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.totalCount).toBe(100);
      }

      expect(mockContext.teamMemberRepository.list).toHaveBeenCalledWith({
        teamId: "team-123",
        pagination: { page: 1, limit: 100, order: "asc", orderBy: "joinedAt" },
      });
    });

    it("自分一人だけのチームでも正常に処理される", async () => {
      const mockMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockMembersWithUser: TeamMemberWithUser[] = [
        {
          teamId: "team-123" as any,
          userId: "user-123" as any,
          role: "admin",
          joinedAt: new Date("2024-01-01T00:00:00Z"),
          user: {
            id: "user-123" as any,
            email: "solo@example.com",
            displayName: "一人管理者",
            hashedPassword: "hashed123",
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
        },
      ];

      const mockResult = {
        items: mockMembersWithUser,
        count: 1,
      };

      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockMember),
      );
      mockContext.teamMemberRepository.list.mockResolvedValue(ok(mockResult));

      const input: GetTeamMembersInput = {
        teamId: "team-123" as any,
        userId: "user-123" as any,
      };

      const result = await getTeamMembers(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.totalCount).toBe(1);
        expect(result.value.items[0].user.displayName).toBe("一人管理者");
      }
    });
  });
});