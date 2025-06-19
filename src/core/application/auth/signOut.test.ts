import type { MockAuthService } from "@/core/adapters/mock/authService";
import { AuthenticationError } from "@/core/domain/auth/types";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it } from "vitest";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import { signOut } from "./signOut";

describe("signOut", () => {
  let context: Context;
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    context = createTestContext();
    mockAuthService = context.authService as MockAuthService;
  });

  it("should successfully sign out a logged-in user", async () => {
    // Arrange: Set up a logged-in user session
    mockAuthService.setCurrentSession({
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Act
    const result = await signOut(context);

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify session is cleared
    const sessionResult = await mockAuthService.getSession();
    expect(sessionResult.isErr()).toBe(true);
    if (sessionResult.isErr()) {
      expect(sessionResult.error.message).toBe("No active session");
    }
  });

  it("should handle sign out when no active session exists", async () => {
    // Arrange: Ensure no active session
    mockAuthService.clear();

    // Act
    const result = await signOut(context);

    // Assert: Should still return ok even if no session exists
    expect(result.isOk()).toBe(true);
  });

  it("should handle authentication service errors gracefully", async () => {
    // Arrange: Mock a service error
    const errorMessage = "Authentication service unavailable";
    mockAuthService.signOut = async () =>
      err(new AuthenticationError(errorMessage));

    // Act
    const result = await signOut(context);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AuthenticationError);
      expect(result.error.message).toBe(errorMessage);
    }
  });

  it("should handle network/connection errors", async () => {
    // Arrange: Mock a network error
    const networkError = new AuthenticationError("Network request failed");
    mockAuthService.signOut = async () => err(networkError);

    // Act
    const result = await signOut(context);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Network request failed");
    }
  });

  it("should handle concurrent sign out requests", async () => {
    // Arrange: Set up a logged-in user
    mockAuthService.setCurrentSession({
      user: {
        id: "user-456",
        email: "concurrent@example.com",
        name: "Concurrent User",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Act: Make multiple concurrent sign out requests
    const results = await Promise.all([
      signOut(context),
      signOut(context),
      signOut(context),
    ]);

    // Assert: All requests should succeed
    for (const result of results) {
      expect(result.isOk()).toBe(true);
    }

    // Verify session is cleared
    const sessionResult = await mockAuthService.getSession();
    expect(sessionResult.isErr()).toBe(true);
  });

  it("should clear all session data on successful sign out", async () => {
    // Arrange: Set up a session with additional data
    const sessionData = {
      user: {
        id: "user-789",
        email: "detailed@example.com",
        name: "Detailed User",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    mockAuthService.setCurrentSession(sessionData);

    // Act
    const result = await signOut(context);

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify all session data is cleared
    const clearedSession = await mockAuthService.getSession();
    expect(clearedSession.isErr()).toBe(true);
  });
});
