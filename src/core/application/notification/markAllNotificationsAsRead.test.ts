import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import {
  markAllNotificationsAsRead,
  type MarkAllNotificationsAsReadInput,
} from "./markAllNotificationsAsRead";

// console.logをモック化
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("markAllNotificationsAsRead", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    mockConsoleLog.mockClear();
  });

  describe("正常系", () => {
    it("有効なuserIdで全通知を既読にできる", async () => {
      const input: MarkAllNotificationsAsReadInput = {
        userId: "user-123" as any,
      };

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking all notifications as read for user user-123",
      );
    });

    it("異なるuserIdでも正常に動作する", async () => {
      const input: MarkAllNotificationsAsReadInput = {
        userId: "user-456" as any,
      };

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking all notifications as read for user user-456",
      );
    });

    it("UUID形式のuserIdでも正常に動作する", async () => {
      const input: MarkAllNotificationsAsReadInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000" as any,
      };

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking all notifications as read for user 550e8400-e29b-41d4-a716-446655440000",
      );
    });
  });

  describe("異常系", () => {
    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        userId: "invalid-user-id",
      } as any;

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("空文字列のuserIdでエラーが返される", async () => {
      const input = {
        userId: "",
      } as any;

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("userIdが未定義でエラーが返される", async () => {
      const input = {} as any;

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("null値のuserIdでエラーが返される", async () => {
      const input = {
        userId: null,
      } as any;

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("数値のuserIdでエラーが返される", async () => {
      const input = {
        userId: 123,
      } as any;

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("配列のuserIdでエラーが返される", async () => {
      const input = {
        userId: ["user-123"],
      } as any;

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("オブジェクトのuserIdでエラーが返される", async () => {
      const input = {
        userId: { id: "user-123" },
      } as any;

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe("境界値テスト", () => {
    it("最小長のuserIdで正常に動作する", async () => {
      const input: MarkAllNotificationsAsReadInput = {
        userId: "u" as any,
      };

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking all notifications as read for user u",
      );
    });

    it("長いuserIdでも正常に動作する", async () => {
      const longUserId = "a".repeat(100);
      const input: MarkAllNotificationsAsReadInput = {
        userId: longUserId as any,
      };

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        `Marking all notifications as read for user ${longUserId}`,
      );
    });

    it("特殊文字を含むuserIdでも正常に動作する", async () => {
      const input: MarkAllNotificationsAsReadInput = {
        userId: "user-123_@#$" as any,
      };

      const result = await markAllNotificationsAsRead(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Marking all notifications as read for user user-123_@#$",
      );
    });
  });
});