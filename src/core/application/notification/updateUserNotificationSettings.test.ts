import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import {
  updateUserNotificationSettings,
  type UpdateUserNotificationSettingsInput,
} from "./updateUserNotificationSettings";
import type { NotificationSettings } from "@/core/domain/notification/types";

describe("updateUserNotificationSettings", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("有効な入力で通知設定を更新できる", async () => {
      const mockSettings: NotificationSettings = {
        invitations: true,
        reviewReminders: false,
        progressUpdates: true,
        teamUpdates: false,
      };

      mockContext.notificationRepository.updateUserSettings.mockResolvedValue(
        ok(undefined),
      );

      const input: UpdateUserNotificationSettingsInput = {
        userId: "user-123" as any,
        settings: mockSettings,
      };

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }

      expect(
        mockContext.notificationRepository.updateUserSettings,
      ).toHaveBeenCalledWith("user-123", mockSettings);
    });

    it("全ての通知設定をfalseに更新できる", async () => {
      const mockSettings: NotificationSettings = {
        invitations: false,
        reviewReminders: false,
        progressUpdates: false,
        teamUpdates: false,
      };

      mockContext.notificationRepository.updateUserSettings.mockResolvedValue(
        ok(undefined),
      );

      const input: UpdateUserNotificationSettingsInput = {
        userId: "user-123" as any,
        settings: mockSettings,
      };

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }

      expect(
        mockContext.notificationRepository.updateUserSettings,
      ).toHaveBeenCalledWith("user-123", mockSettings);
    });

    it("全ての通知設定をtrueに更新できる", async () => {
      const mockSettings: NotificationSettings = {
        invitations: true,
        reviewReminders: true,
        progressUpdates: true,
        teamUpdates: true,
      };

      mockContext.notificationRepository.updateUserSettings.mockResolvedValue(
        ok(undefined),
      );

      const input: UpdateUserNotificationSettingsInput = {
        userId: "user-123" as any,
        settings: mockSettings,
      };

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }

      expect(
        mockContext.notificationRepository.updateUserSettings,
      ).toHaveBeenCalledWith("user-123", mockSettings);
    });

    it("一部の通知設定のみ更新できる", async () => {
      const mockSettings: NotificationSettings = {
        invitations: true,
        reviewReminders: false,
        progressUpdates: false,
        teamUpdates: true,
      };

      mockContext.notificationRepository.updateUserSettings.mockResolvedValue(
        ok(undefined),
      );

      const input: UpdateUserNotificationSettingsInput = {
        userId: "user-456" as any,
        settings: mockSettings,
      };

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }

      expect(
        mockContext.notificationRepository.updateUserSettings,
      ).toHaveBeenCalledWith("user-456", mockSettings);
    });
  });

  describe("異常系", () => {
    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        userId: "invalid-user-id",
        settings: {
          invitations: true,
          reviewReminders: false,
          progressUpdates: true,
          teamUpdates: false,
        },
      } as any;

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空文字列のuserIdでエラーが返される", async () => {
      const input = {
        userId: "",
        settings: {
          invitations: true,
          reviewReminders: false,
          progressUpdates: true,
          teamUpdates: false,
        },
      } as any;

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("userIdが未定義でエラーが返される", async () => {
      const input = {
        settings: {
          invitations: true,
          reviewReminders: false,
          progressUpdates: true,
          teamUpdates: false,
        },
      } as any;

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("settingsが未定義でエラーが返される", async () => {
      const input = {
        userId: "user-123" as any,
      } as any;

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("不完全なsettingsでエラーが返される", async () => {
      const input = {
        userId: "user-123" as any,
        settings: {
          invitations: true,
          // 他のプロパティが不足
        },
      } as any;

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("無効な型のsettingsでエラーが返される", async () => {
      const input = {
        userId: "user-123" as any,
        settings: {
          invitations: "true", // 文字列（boolean以外）
          reviewReminders: false,
          progressUpdates: true,
          teamUpdates: false,
        },
      } as any;

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("null値のsettingsでエラーが返される", async () => {
      const input = {
        userId: "user-123" as any,
        settings: null,
      } as any;

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("余分なプロパティを含むsettingsでエラーが返される", async () => {
      const input = {
        userId: "user-123" as any,
        settings: {
          invitations: true,
          reviewReminders: false,
          progressUpdates: true,
          teamUpdates: false,
          extraProperty: true, // 余分なプロパティ
        },
      } as any;

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("リポジトリエラーが適切に処理される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.notificationRepository.updateUserSettings.mockResolvedValue(
        err(repositoryError),
      );

      const input: UpdateUserNotificationSettingsInput = {
        userId: "user-123" as any,
        settings: {
          invitations: true,
          reviewReminders: false,
          progressUpdates: true,
          teamUpdates: false,
        },
      };

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to update notification settings");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("存在しないユーザーでリポジトリエラーが処理される", async () => {
      const repositoryError = new RepositoryError("User not found");
      mockContext.notificationRepository.updateUserSettings.mockResolvedValue(
        err(repositoryError),
      );

      const input: UpdateUserNotificationSettingsInput = {
        userId: "nonexistent-user" as any,
        settings: {
          invitations: true,
          reviewReminders: false,
          progressUpdates: true,
          teamUpdates: false,
        },
      };

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to update notification settings");
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

      mockContext.notificationRepository.updateUserSettings.mockResolvedValue(
        ok(undefined),
      );

      const input: UpdateUserNotificationSettingsInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000" as any,
        settings: mockSettings,
      };

      const result = await updateUserNotificationSettings(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockSettings);
      }

      expect(
        mockContext.notificationRepository.updateUserSettings,
      ).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000", mockSettings);
    });
  });
});