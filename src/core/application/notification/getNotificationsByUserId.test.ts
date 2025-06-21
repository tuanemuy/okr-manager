import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import {
  getNotificationsByUserId,
  type GetNotificationsByUserIdInput,
} from "./getNotificationsByUserId";
import type { Notification } from "@/core/domain/notification/types";

describe("getNotificationsByUserId", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("有効な入力で通知一覧を取得できる", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notification-1" as any,
          type: "invitation",
          title: "チーム招待",
          message: "新しいチームに招待されました",
          isRead: false,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          metadata: { teamId: "team1" },
        },
        {
          id: "notification-2" as any,
          type: "review_reminder",
          title: "レビュー期限通知",
          message: "OKRレビューの期限が近づいています",
          isRead: true,
          createdAt: new Date("2024-01-02T00:00:00Z"),
        },
      ];

      const mockResult = {
        items: mockNotifications,
        totalCount: 2,
        unreadCount: 1,
      };

      mockContext.notificationRepository.getByUserId.mockResolvedValue(
        ok(mockResult),
      );

      const input: GetNotificationsByUserIdInput = {
        userId: "user-123" as any,
        pagination: { page: 1, limit: 10 },
        unreadOnly: false,
      };

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockResult);
      }

      expect(
        mockContext.notificationRepository.getByUserId,
      ).toHaveBeenCalledWith("user-123", 1, 10, false);
    });

    it("未読のみフィルターで通知一覧を取得できる", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notification-1" as any,
          type: "invitation",
          title: "チーム招待",
          message: "新しいチームに招待されました",
          isRead: false,
          createdAt: new Date("2024-01-01T00:00:00Z"),
        },
      ];

      const mockResult = {
        items: mockNotifications,
        totalCount: 1,
        unreadCount: 1,
      };

      mockContext.notificationRepository.getByUserId.mockResolvedValue(
        ok(mockResult),
      );

      const input: GetNotificationsByUserIdInput = {
        userId: "user-123" as any,
        pagination: { page: 1, limit: 10 },
        unreadOnly: true,
      };

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockResult);
      }

      expect(
        mockContext.notificationRepository.getByUserId,
      ).toHaveBeenCalledWith("user-123", 1, 10, true);
    });

    it("空の結果を正常に処理できる", async () => {
      const mockResult = {
        items: [],
        totalCount: 0,
        unreadCount: 0,
      };

      mockContext.notificationRepository.getByUserId.mockResolvedValue(
        ok(mockResult),
      );

      const input: GetNotificationsByUserIdInput = {
        userId: "user-123" as any,
        pagination: { page: 1, limit: 10 },
        unreadOnly: false,
      };

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockResult);
      }
    });

    it("ページネーションのパラメータが正しく渡される", async () => {
      const mockResult = {
        items: [],
        totalCount: 0,
        unreadCount: 0,
      };

      mockContext.notificationRepository.getByUserId.mockResolvedValue(
        ok(mockResult),
      );

      const input: GetNotificationsByUserIdInput = {
        userId: "user-123" as any,
        pagination: { page: 2, limit: 5 },
        unreadOnly: false,
      };

      await getNotificationsByUserId(mockContext, input);

      expect(
        mockContext.notificationRepository.getByUserId,
      ).toHaveBeenCalledWith("user-123", 2, 5, false);
    });
  });

  describe("異常系", () => {
    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        userId: "invalid-user-id",
        pagination: { page: 1, limit: 10 },
        unreadOnly: false,
      } as any;

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("無効なページネーションでエラーが返される", async () => {
      const input = {
        userId: "user-123" as any,
        pagination: { page: 0, limit: 10 },
        unreadOnly: false,
      } as any;

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("ページネーションのlimitが範囲外でエラーが返される", async () => {
      const input = {
        userId: "user-123" as any,
        pagination: { page: 1, limit: 0 },
        unreadOnly: false,
      } as any;

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("リポジトリエラーが適切に処理される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.notificationRepository.getByUserId.mockResolvedValue(
        err(repositoryError),
      );

      const input: GetNotificationsByUserIdInput = {
        userId: "user-123" as any,
        pagination: { page: 1, limit: 10 },
        unreadOnly: false,
      };

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get notifications");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("unreadOnlyが省略された場合、デフォルトでfalseが設定される", async () => {
      const mockResult = {
        items: [],
        totalCount: 0,
        unreadCount: 0,
      };

      mockContext.notificationRepository.getByUserId.mockResolvedValue(
        ok(mockResult),
      );

      const input = {
        userId: "user-123" as any,
        pagination: { page: 1, limit: 10 },
        // unreadOnly省略
      };

      await getNotificationsByUserId(mockContext, input);

      expect(
        mockContext.notificationRepository.getByUserId,
      ).toHaveBeenCalledWith("user-123", 1, 10, false);
    });
  });

  describe("境界値テスト", () => {
    it("最小ページネーション値で正常に動作する", async () => {
      const mockResult = {
        items: [],
        totalCount: 0,
        unreadCount: 0,
      };

      mockContext.notificationRepository.getByUserId.mockResolvedValue(
        ok(mockResult),
      );

      const input: GetNotificationsByUserIdInput = {
        userId: "user-123" as any,
        pagination: { page: 1, limit: 1 },
        unreadOnly: false,
      };

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(
        mockContext.notificationRepository.getByUserId,
      ).toHaveBeenCalledWith("user-123", 1, 1, false);
    });

    it("最大ページネーション値で正常に動作する", async () => {
      const mockResult = {
        items: [],
        totalCount: 0,
        unreadCount: 0,
      };

      mockContext.notificationRepository.getByUserId.mockResolvedValue(
        ok(mockResult),
      );

      const input: GetNotificationsByUserIdInput = {
        userId: "user-123" as any,
        pagination: { page: 1, limit: 100 },
        unreadOnly: false,
      };

      const result = await getNotificationsByUserId(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(
        mockContext.notificationRepository.getByUserId,
      ).toHaveBeenCalledWith("user-123", 1, 100, false);
    });
  });
});