import { beforeEach, describe, expect, it } from "vitest";
import type { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import type { MockSessionManager } from "@/core/adapters/mock/sessionManager";
import type { MockUserRepository } from "@/core/adapters/mock/userRepository";
import { type User, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";
import { createTestContext } from "../testUtils";
import { type LoginUserInput, loginUser } from "./loginUser";

describe("loginUser", () => {
  let context: Context;
  let mockUserRepository: MockUserRepository;
  let mockPasswordHasher: MockPasswordHasher;
  let mockSessionManager: MockSessionManager;
  let testUser: User;
  let validInput: LoginUserInput;

  beforeEach(async () => {
    context = createTestContext();
    mockUserRepository = context.userRepository as MockUserRepository;
    mockPasswordHasher = context.passwordHasher as MockPasswordHasher;
    mockSessionManager = context.sessionManager as MockSessionManager;

    // Set up test user
    const hashedPasswordResult = await mockPasswordHasher.hash("password123");
    if (hashedPasswordResult.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    testUser = {
      id: userIdSchema.parse("550e8400-e29b-41d4-a716-446655440000"),
      email: "test@example.com",
      displayName: "Test User",
      hashedPassword: hashedPasswordResult.value,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    validInput = {
      email: "test@example.com",
      password: "password123",
    };

    // Seed the user repository
    const userResult = await mockUserRepository.create({
      email: testUser.email,
      displayName: testUser.displayName,
      hashedPassword: testUser.hashedPassword,
    });

    // Update user to match what was actually created
    if (userResult.isOk()) {
      testUser = userResult.value;
    }
  });

  describe("successful login", () => {
    it("should successfully log in user with valid credentials", async () => {
      // Act
      const result = await loginUser(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe(testUser.email);
        expect(result.value.displayName).toBe(testUser.displayName);
      }

      // Note: Session creation is handled by NextAuth automatically
      // This test just verifies user authentication is successful
    });

    it("should validate user credentials correctly", async () => {
      // Act
      const result = await loginUser(context, validInput);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(testUser.id);
        expect(result.value.email).toBe(testUser.email);
        expect(result.value.displayName).toBe(testUser.displayName);
      }
    });
  });

  describe("input validation", () => {
    it("should reject invalid email format", async () => {
      // Arrange
      const invalidInput = {
        email: "invalid-email",
        password: "password123",
      };

      // Act
      const result = await loginUser(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid login input");
      }
    });

    it("should reject empty email", async () => {
      // Arrange
      const invalidInput = {
        email: "",
        password: "password123",
      };

      // Act
      const result = await loginUser(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid login input");
      }
    });

    it("should reject empty password", async () => {
      // Arrange
      const invalidInput = {
        email: "test@example.com",
        password: "",
      };

      // Act
      const result = await loginUser(context, invalidInput);

      // Assert
      expect(result.isErr()).toBe(true);
      // Empty password should be rejected
    });
  });

  describe("authentication failures", () => {
    it("should reject login for non-existent user", async () => {
      // Arrange
      const nonExistentInput = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // Act
      const result = await loginUser(context, nonExistentInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid email or password");
      }
    });

    it("should reject login with incorrect password", async () => {
      // Arrange
      const wrongPasswordInput = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      // Act
      const result = await loginUser(context, wrongPasswordInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid email or password");
      }
    });

    it("should handle password verification failure", async () => {
      // Arrange
      mockPasswordHasher.setShouldFailVerify(true, "Hash verification failed");

      // Act
      const result = await loginUser(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to verify password");
      }
    });
  });

  describe("repository errors", () => {
    it("should handle user repository fetch errors", async () => {
      // Arrange
      mockUserRepository.setShouldFailGetByEmail(
        true,
        "Database connection failed",
      );

      // Act
      const result = await loginUser(context, validInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to find user");
      }
    });
  });

  // Session management is handled by NextAuth, not in loginUser function

  describe("edge cases", () => {
    it("should handle case-sensitive email matching", async () => {
      // Arrange
      const uppercaseEmailInput = {
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      };

      // Act
      const result = await loginUser(context, uppercaseEmailInput);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid email or password");
      }
    });

    it("should handle very long passwords", async () => {
      // Arrange
      const longPassword = "a".repeat(1000);
      const hashedResult = await mockPasswordHasher.hash(longPassword);
      if (hashedResult.isErr()) {
        throw new Error("Failed to hash password in test");
      }

      const longPasswordUser = {
        ...testUser,
        email: "longpass@example.com",
        hashedPassword: hashedResult.value,
      };

      await mockUserRepository.create({
        email: longPasswordUser.email,
        displayName: longPasswordUser.displayName,
        hashedPassword: longPasswordUser.hashedPassword,
      });

      const longPasswordInput = {
        email: "longpass@example.com",
        password: longPassword,
      };

      // Act
      const result = await loginUser(context, longPasswordInput);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle special characters in password", async () => {
      // Arrange
      const specialPassword = "p@$$w0rd!@#$%^&*()";
      const hashedResult = await mockPasswordHasher.hash(specialPassword);
      if (hashedResult.isErr()) {
        throw new Error("Failed to hash password in test");
      }

      const specialPasswordUser = {
        ...testUser,
        email: "special@example.com",
        hashedPassword: hashedResult.value,
      };

      await mockUserRepository.create({
        email: specialPasswordUser.email,
        displayName: specialPasswordUser.displayName,
        hashedPassword: specialPasswordUser.hashedPassword,
      });

      const specialPasswordInput = {
        email: "special@example.com",
        password: specialPassword,
      };

      // Act
      const result = await loginUser(context, specialPasswordInput);

      // Assert
      expect(result.isOk()).toBe(true);
    });
  });

  describe("concurrent login attempts", () => {
    it("should handle multiple concurrent login attempts for same user", async () => {
      // Act
      const results = await Promise.all([
        loginUser(context, validInput),
        loginUser(context, validInput),
        loginUser(context, validInput),
      ]);

      // Assert: All should either succeed or fail consistently
      const successCount = results.filter((r) => r.isOk()).length;
      const failureCount = results.filter((r) => r.isErr()).length;

      // At least one should succeed (the first one to create session)
      // Others might fail due to session conflicts, which is acceptable
      expect(successCount).toBeGreaterThanOrEqual(1);
      expect(successCount + failureCount).toBe(3);
    });
  });
});
