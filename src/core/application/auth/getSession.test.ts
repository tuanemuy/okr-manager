import { MockAuthService } from "@/core/adapters/mock/authService";
import type { SessionData } from "@/core/domain/auth/types";
import { beforeEach, describe, expect, it } from "vitest";
import type { Context } from "../context";
import { getSession } from "./getSession";

describe("getSession", () => {
  let context: Context;
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    mockAuthService = new MockAuthService();

    context = {
      authService: mockAuthService,
    } as unknown as Context;
  });

  it("should return session data when user is signed in", async () => {
    const sessionData: SessionData = {
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    mockAuthService.setCurrentSession(sessionData);

    const result = await getSession(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(sessionData);
    }
  });

  it("should return null when no user is signed in", async () => {
    mockAuthService.setCurrentSession(null);

    const result = await getSession(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });
});
