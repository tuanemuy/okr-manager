import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it } from "vitest";
import { MockAuthService } from "@/core/adapters/mock/authService";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import { AuthenticationError } from "@/core/domain/auth/types";
import type { Context } from "../context";
import { signOut } from "./signOut";

describe("signOut", () => {
  let context: Context;
  let mockAuthService: MockAuthService;
  let mockUserRepository: MockUserRepository;
  let mockPasswordHasher: MockPasswordHasher;

  beforeEach(() => {
    mockAuthService = new MockAuthService();
    mockUserRepository = new MockUserRepository();
    mockPasswordHasher = new MockPasswordHasher();

    context = {
      authService: mockAuthService,
      userRepository: mockUserRepository,
      passwordHasher: mockPasswordHasher,
    };
  });

  it("should successfully sign out a logged-in user", async () => {
    // Arrange: Set up a logged-in user session
    mockAuthService.setCurrentSession({
      id: "session-123",
      userId: "user-123",
      email: "user@example.com",
      name: "Test User",
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
      id: "session-456",
      userId: "user-456",
      email: "concurrent@example.com",
      name: "Concurrent User",
    });

    // Act: Make multiple concurrent sign out requests
    const results = await Promise.all([
      signOut(context),
      signOut(context),
      signOut(context),
    ]);

    // Assert: All requests should succeed
    results.forEach(result => {
      expect(result.isOk()).toBe(true);
    });

    // Verify session is cleared
    const sessionResult = await mockAuthService.getSession();
    expect(sessionResult.isErr()).toBe(true);
  });

  it("should clear all session data on successful sign out", async () => {
    // Arrange: Set up a session with additional data
    const sessionData = {
      id: "session-789",
      userId: "user-789",
      email: "detailed@example.com",
      name: "Detailed User",
      // Additional session data that should be cleared
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