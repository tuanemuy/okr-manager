import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import { updateOkr, type UpdateOkrInput } from "./updateOkr";
import type { Okr, TeamMember } from "@/core/domain/okr/types";

describe("updateOkr", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("OKRのオーナーがタイトルと説明を更新できる", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "元のタイトル",
        description: "元の説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-owner" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const updatedOkr: Okr = {
        ...mockOkr,
        title: "更新されたタイトル",
        description: "更新された説明",
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );
      mockContext.okrRepository.update.mockResolvedValue(ok(updatedOkr));

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: "更新されたタイトル",
        description: "更新された説明",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(updatedOkr);
      }

      expect(mockContext.okrRepository.getById).toHaveBeenCalledWith("okr-123");
      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).toHaveBeenCalledWith("team-123", "user-owner");
      expect(mockContext.okrRepository.update).toHaveBeenCalledWith("okr-123", {
        title: "更新されたタイトル",
        description: "更新された説明",
      });
    });

    it("チーム管理者がOKRを更新できる", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "元のタイトル",
        description: "元の説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-admin" as any,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const updatedOkr: Okr = {
        ...mockOkr,
        title: "管理者が更新したタイトル",
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );
      mockContext.okrRepository.update.mockResolvedValue(ok(updatedOkr));

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-admin" as any,
        title: "管理者が更新したタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(updatedOkr);
      }
    });

    it("タイトルのみを更新できる", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "元のタイトル",
        description: "元の説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-owner" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const updatedOkr: Okr = {
        ...mockOkr,
        title: "新しいタイトル",
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );
      mockContext.okrRepository.update.mockResolvedValue(ok(updatedOkr));

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("新しいタイトル");
      }

      expect(mockContext.okrRepository.update).toHaveBeenCalledWith("okr-123", {
        title: "新しいタイトル",
      });
    });

    it("説明のみを更新できる", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "タイトル",
        description: "元の説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-owner" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const updatedOkr: Okr = {
        ...mockOkr,
        description: "新しい説明",
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );
      mockContext.okrRepository.update.mockResolvedValue(ok(updatedOkr));

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        description: "新しい説明",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe("新しい説明");
      }

      expect(mockContext.okrRepository.update).toHaveBeenCalledWith("okr-123", {
        description: "新しい説明",
      });
    });
  });

  describe("異常系", () => {
    it("無効なokrIdでエラーが返される", async () => {
      const input = {
        okrId: "invalid-okr-id",
        userId: "user-owner" as any,
        title: "新しいタイトル",
      } as any;

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid update OKR input");
      }

      expect(mockContext.okrRepository.getById).not.toHaveBeenCalled();
    });

    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        okrId: "okr-123" as any,
        userId: "invalid-user-id",
        title: "新しいタイトル",
      } as any;

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid update OKR input");
      }
    });

    it("存在しないOKRでエラーが返される", async () => {
      mockContext.okrRepository.getById.mockResolvedValue(ok(null));

      const input: UpdateOkrInput = {
        okrId: "nonexistent-okr" as any,
        userId: "user-owner" as any,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("OKR not found");
      }

      expect(
        mockContext.teamMemberRepository.getByTeamAndUser,
      ).not.toHaveBeenCalled();
    });

    it("ユーザーがチームメンバーでない場合エラーが返される", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "タイトル",
        description: "説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(null),
      );

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-outsider" as any,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User is not a member of this team");
      }

      expect(mockContext.okrRepository.update).not.toHaveBeenCalled();
    });

    it("オーナーでも管理者でもないユーザーがOKRを更新しようとした場合エラーが返される", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "タイトル",
        description: "説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-viewer" as any,
        role: "viewer",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-viewer" as any,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Insufficient permissions to edit this OKR");
      }

      expect(mockContext.okrRepository.update).not.toHaveBeenCalled();
    });

    it("OKR取得でリポジトリエラーが発生した場合エラーが返される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.okrRepository.getById.mockResolvedValue(err(repositoryError));

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get OKR");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("チームメンバー確認でリポジトリエラーが発生した場合エラーが返される", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "タイトル",
        description: "説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const repositoryError = new RepositoryError("Database connection failed");

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        err(repositoryError),
      );

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to check team membership");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("OKR更新でリポジトリエラーが発生した場合エラーが返される", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "タイトル",
        description: "説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-owner" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const repositoryError = new RepositoryError("Database connection failed");

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );
      mockContext.okrRepository.update.mockResolvedValue(err(repositoryError));

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to update OKR");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("タイトルが空文字列の場合エラーが返される", async () => {
      const input = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: "",
      } as any;

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid update OKR input");
      }
    });

    it("タイトルが201文字以上の場合エラーが返される", async () => {
      const longTitle = "a".repeat(201);
      const input = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: longTitle,
      } as any;

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid update OKR input");
      }
    });

    it("必須パラメータが不足している場合エラーが返される", async () => {
      const input = {
        okrId: "okr-123" as any,
        // userId missing
        title: "新しいタイトル",
      } as any;

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid update OKR input");
      }
    });
  });

  describe("境界値テスト", () => {
    it("最短のタイトル（1文字）で更新できる", async () => {
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "元のタイトル",
        description: "元の説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-owner" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const updatedOkr: Okr = {
        ...mockOkr,
        title: "A",
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );
      mockContext.okrRepository.update.mockResolvedValue(ok(updatedOkr));

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: "A",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("A");
      }
    });

    it("最長のタイトル（200文字）で更新できる", async () => {
      const longTitle = "a".repeat(200);
      const mockOkr: Okr = {
        id: "okr-123" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "元のタイトル",
        description: "元の説明",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-owner" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const updatedOkr: Okr = {
        ...mockOkr,
        title: longTitle,
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );
      mockContext.okrRepository.update.mockResolvedValue(ok(updatedOkr));

      const input: UpdateOkrInput = {
        okrId: "okr-123" as any,
        userId: "user-owner" as any,
        title: longTitle,
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe(longTitle);
      }
    });

    it("個人OKRでも正常に更新できる", async () => {
      const mockOkr: Okr = {
        id: "okr-personal" as any,
        teamId: "team-123" as any,
        ownerId: "user-owner" as any,
        title: "個人OKR",
        description: "個人的な目標",
        period: {
          year: 2024,
          quarter: "Q1",
        },
        type: "personal",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: "team-123" as any,
        userId: "user-owner" as any,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const updatedOkr: Okr = {
        ...mockOkr,
        title: "更新された個人OKR",
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      };

      mockContext.okrRepository.getById.mockResolvedValue(ok(mockOkr));
      mockContext.teamMemberRepository.getByTeamAndUser.mockResolvedValue(
        ok(mockTeamMember),
      );
      mockContext.okrRepository.update.mockResolvedValue(ok(updatedOkr));

      const input: UpdateOkrInput = {
        okrId: "okr-personal" as any,
        userId: "user-owner" as any,
        title: "更新された個人OKR",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("更新された個人OKR");
        expect(result.value.type).toBe("personal");
      }
    });
  });
});