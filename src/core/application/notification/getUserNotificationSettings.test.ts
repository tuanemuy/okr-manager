import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import {
  getUserNotificationSettings,
  type GetUserNotificationSettingsInput,
} from "./getUserNotificationSettings";
import type { NotificationSettings } from "@/core/domain/notification/types";

describe("getUserNotificationSettings", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("有効なuserIdで通知設定を取得できる", async () => {
      const mockSettings: NotificationSettings = {
        invitations: true,
        reviewReminders: true,
        progressUpdates: false,
        teamUpdates: true,
      };

      mockContext.notificationRepository.getUserSettings.mockResolvedValue(
        ok(mockSettings),
      );

      const input: GetUserNotificationSettingsInput = {
        userId: "user-123" as any,
      };

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }

      expect(
        mockContext.notificationRepository.getUserSettings,
      ).toHaveBeenCalledWith("user-123");
    });

    it("全ての通知設定がfalseの場合も正常に処理される", async () => {
      const mockSettings: NotificationSettings = {
        invitations: false,
        reviewReminders: false,
        progressUpdates: false,
        teamUpdates: false,
      };

      mockContext.notificationRepository.getUserSettings.mockResolvedValue(
        ok(mockSettings),
      );

      const input: GetUserNotificationSettingsInput = {
        userId: "user-123" as any,
      };

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }
    });

    it("全ての通知設定がtrueの場合も正常に処理される", async () => {
      const mockSettings: NotificationSettings = {
        invitations: true,
        reviewReminders: true,
        progressUpdates: true,
        teamUpdates: true,
      };

      mockContext.notificationRepository.getUserSettings.mockResolvedValue(
        ok(mockSettings),
      );

      const input: GetUserNotificationSettingsInput = {
        userId: "user-123" as any,
      };

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }
    });
  });

  describe("異常系", () => {
    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        userId: "invalid-user-id",
      } as any;

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空文字列のuserIdでエラーが返される", async () => {
      const input = {
        userId: "",
      } as any;

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("userIdが未定義でエラーが返される", async () => {
      const input = {} as any;

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("リポジトリエラーが適切に処理される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.notificationRepository.getUserSettings.mockResolvedValue(
        err(repositoryError),
      );

      const input: GetUserNotificationSettingsInput = {
        userId: "user-123" as any,
      };

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get notification settings");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("存在しないユーザーの設定取得でリポジトリエラーが処理される", async () => {
      const repositoryError = new RepositoryError("User not found");
      mockContext.notificationRepository.getUserSettings.mockResolvedValue(
        err(repositoryError),
      );

      const input: GetUserNotificationSettingsInput = {
        userId: "nonexistent-user" as any,
      };

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get notification settings");
        expect(result.error.cause).toBe(repositoryError);
      }
    });
  });

  describe("境界値テスト", () => {
    it("UUID形式のuserIdで正常に動作する", async () => {
      const mockSettings: NotificationSettings = {
        invitations: true,
        reviewReminders: false,
        progressUpdates: true,
        teamUpdates: false,
      };

      mockContext.notificationRepository.getUserSettings.mockResolvedValue(
        ok(mockSettings),
      );

      const input: GetUserNotificationSettingsInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000" as any,
      };

      const result = await getUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }

      expect(
        mockContext.notificationRepository.getUserSettings,
      ).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000");
    });
  });
});