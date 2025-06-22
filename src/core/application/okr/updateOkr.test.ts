import { beforeEach, describe, expect, it } from "vitest";
import type { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import type { MockTeamMemberRepository } from "@/core/adapters/mock/teamMemberRepository";
import type { Okr } from "@/core/domain/okr/types";
import { okrIdSchema } from "@/core/domain/okr/types";
import type { TeamMember } from "@/core/domain/team/types";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { createTestContext } from "../testUtils";
import { type UpdateOkrInput, updateOkr } from "./updateOkr";

describe("updateOkr", () => {
  let mockContext: ReturnType<typeof createTestContext>;
  let mockOkrRepository: MockOkrRepository;
  let mockTeamMemberRepository: MockTeamMemberRepository;

  beforeEach(() => {
    mockContext = createTestContext();
    mockOkrRepository = mockContext.okrRepository as MockOkrRepository;
    mockTeamMemberRepository =
      mockContext.teamMemberRepository as MockTeamMemberRepository;
    mockOkrRepository.clear();
    mockTeamMemberRepository.clear();
  });

  describe("正常系", () => {
    it("OKRのオーナーがタイトルと説明を更新できる", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440000");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440001");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440002");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "元のタイトル",
        description: "元の説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: userId,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
        title: "更新されたタイトル",
        description: "更新された説明",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("更新されたタイトル");
        expect(result.value.description).toBe("更新された説明");
      }
    });

    it("チーム管理者がOKRを更新できる", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440003");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440004");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440005");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "元のタイトル",
        description: "元の説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: userId,
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
        title: "管理者が更新したタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("管理者が更新したタイトル");
      }
    });

    it("タイトルのみを更新できる", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440006");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440007");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440008");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "元のタイトル",
        description: "元の説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: userId,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("新しいタイトル");
      }
    });

    it("説明のみを更新できる", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440009");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440010");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440011");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "タイトル",
        description: "元の説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: userId,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
        description: "新しい説明",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe("新しい説明");
      }
    });
  });

  describe("異常系", () => {
    it("無効なokrIdでエラーが返される", async () => {
      const input = {
        okrId: "invalid-okr-id",
        userId: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440012"),
        title: "新しいタイトル",
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid update OKR input");
      }
    });

    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        okrId: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440013"),
        userId: "invalid-user-id",
        title: "新しいタイトル",
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
      } as any;

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid update OKR input");
      }
    });

    it("存在しないOKRでエラーが返される", async () => {
      const input: UpdateOkrInput = {
        okrId: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440014"),
        userId: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440015"),
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("OKR not found");
      }
    });

    it("ユーザーがチームメンバーでない場合エラーが返される", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440016");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440017");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440018");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "タイトル",
        description: "説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User is not a member of this team");
      }
    });

    it("オーナーでも管理者でもないユーザーがOKRを更新しようとした場合エラーが返される", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440019");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440020");
      const ownerId = userIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440021",
      );
      const viewerId = userIdSchema.parse(
        "550e8400-e29b-41d4-a716-446655440022",
      );

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: ownerId,
        title: "タイトル",
        description: "説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: viewerId,
        role: "viewer",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: viewerId,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "Insufficient permissions to edit this OKR",
        );
      }
    });

    it("OKR取得でリポジトリエラーが発生した場合エラーが返される", async () => {
      mockOkrRepository.setShouldFailGetById(
        true,
        "Database connection failed",
      );

      const input: UpdateOkrInput = {
        okrId: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440023"),
        userId: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440024"),
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get OKR");
      }
    });

    it("チームメンバー確認でリポジトリエラーが発生した場合エラーが返される", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440025");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440026");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440027");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "タイトル",
        description: "説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.setShouldFailGetByTeamAndUser(
        true,
        "Database connection failed",
      );

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to check team membership");
      }
    });

    it("OKR更新でリポジトリエラーが発生した場合エラーが返される", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440028");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440029");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440030");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "タイトル",
        description: "説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: userId,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);
      mockOkrRepository.setShouldFailUpdate(true, "Database connection failed");

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
        title: "新しいタイトル",
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to update OKR");
      }
    });

    it("タイトルが空文字列の場合エラーが返される", async () => {
      const input = {
        okrId: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440031"),
        userId: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440032"),
        title: "",
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
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
        okrId: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440033"),
        userId: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440034"),
        title: longTitle,
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
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
        okrId: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440035"),
        // userId missing
        title: "新しいタイトル",
        // biome-ignore lint/suspicious/noExplicitAny: テスト用の型キャスト
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
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440036");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440037");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440038");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "元のタイトル",
        description: "元の説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: userId,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
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
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440039");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440040");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440041");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "元のタイトル",
        description: "元の説明",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "team",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: userId,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
        title: longTitle,
      };

      const result = await updateOkr(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe(longTitle);
      }
    });

    it("個人OKRでも正常に更新できる", async () => {
      const okrId = okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440042");
      const teamId = teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440043");
      const userId = userIdSchema.parse("550e8400-e29b-41d4-a716-446655440044");

      const mockOkr: Okr = {
        id: okrId,
        teamId: teamId,
        ownerId: userId,
        title: "個人OKR",
        description: "個人的な目標",
        quarterYear: 2024,
        quarterQuarter: 1,
        type: "personal",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const mockTeamMember: TeamMember = {
        teamId: teamId,
        userId: userId,
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockOkrRepository.addOkr(mockOkr);
      mockTeamMemberRepository.addMember(mockTeamMember);

      const input: UpdateOkrInput = {
        okrId: okrId,
        userId: userId,
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
