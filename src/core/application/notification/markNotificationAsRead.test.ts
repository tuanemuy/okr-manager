import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import {
  markNotificationAsRead,
  type MarkNotificationAsReadInput,
} from "./markNotificationAsRead";

// console.logをモック化
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("markNotificationAsRead", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    mockConsoleLog.mockClear();
  });

  describe("正常系", () => {
    it("有効なnotificationIdとuserIdで通知を既読にできる", async () => {
      const input: MarkNotificationAsReadInput = {
        notificationId: "notification-123",
        userId: "user-123" as any,
      };

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking notification notification-123 as read for user user-123",
      );
    });

    it("異なるIDの組み合わせでも正常に動作する", async () => {
      const input: MarkNotificationAsReadInput = {
        notificationId: "notification-456",
        userId: "user-456" as any,
      };

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking notification notification-456 as read for user user-456",
      );
    });

    it("UUID形式のIDでも正常に動作する", async () => {
      const input: MarkNotificationAsReadInput = {
        notificationId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "550e8400-e29b-41d4-a716-446655440000" as any,
      };

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking notification 550e8400-e29b-41d4-a716-446655440001 as read for user 550e8400-e29b-41d4-a716-446655440000",
      );
    });
  });

  describe("異常系", () => {
    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        notificationId: "notification-123",
        userId: "invalid-user-id",
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("空文字列のnotificationIdでエラーが返される", async () => {
      const input = {
        notificationId: "",
        userId: "user-123" as any,
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("空文字列のuserIdでエラーが返される", async () => {
      const input = {
        notificationId: "notification-123",
        userId: "",
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("notificationIdが未定義でエラーが返される", async () => {
      const input = {
        userId: "user-123" as any,
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("userIdが未定義でエラーが返される", async () => {
      const input = {
        notificationId: "notification-123",
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("両方のIDが未定義でエラーが返される", async () => {
      const input = {} as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("null値のnotificationIdでエラーが返される", async () => {
      const input = {
        notificationId: null,
        userId: "user-123" as any,
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("数値のnotificationIdでエラーが返される", async () => {
      const input = {
        notificationId: 123,
        userId: "user-123" as any,
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("配列のIDでエラーが返される", async () => {
      const input = {
        notificationId: ["notification-123"],
        userId: ["user-123"],
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("オブジェクトのIDでエラーが返される", async () => {
      const input = {
        notificationId: { id: "notification-123" },
        userId: { id: "user-123" },
      } as any;

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe("境界値テスト", () => {
    it("最小長のIDで正常に動作する", async () => {
      const input: MarkNotificationAsReadInput = {
        notificationId: "n",
        userId: "u" as any,
      };

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking notification n as read for user u",
      );
    });

    it("長いIDでも正常に動作する", async () => {
      const longNotificationId = "notification-" + "a".repeat(100);
      const longUserId = "user-" + "b".repeat(100);
      const input: MarkNotificationAsReadInput = {
        notificationId: longNotificationId,
        userId: longUserId as any,
      };

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        `Marking notification ${longNotificationId} as read for user ${longUserId}`,
      );
    });

    it("特殊文字を含むIDでも正常に動作する", async () => {
      const input: MarkNotificationAsReadInput = {
        notificationId: "notification-123_@#$",
        userId: "user-456_@#$" as any,
      };

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking notification notification-123_@#$ as read for user user-456_@#$",
      );
    });

    it("同じIDでも正常に動作する", async () => {
      const input: MarkNotificationAsReadInput = {
        notificationId: "same-id",
        userId: "same-id" as any,
      };

      const result = await markNotificationAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking notification same-id as read for user same-id",
      );
    });
  });
});