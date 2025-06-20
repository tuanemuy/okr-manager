import { beforeEach, describe, expect, it } from "vitest";
import { MockAuthService } from "@/core/adapters/mock/authService";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { UserId } from "@/core/domain/user/types";
import type { Context } from "../context";
import { type CreateUserInput, createUser } from "./createUser";

describe("createUser", () => {
  let context: Context;
  let mockUserRepository: MockUserRepository;
  let mockPasswordHasher: MockPasswordHasher;
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockPasswordHasher = new MockPasswordHasher();
    mockAuthService = new MockAuthService();

    context = {
      userRepository: mockUserRepository,
      passwordHasher: mockPasswordHasher,
      authService: mockAuthService,
      // Other repositories can be mocked when needed
    } as unknown as Context;
  });

  it("should create a new user successfully", async () => {
    const input: CreateUserInput = {
      email: "test@example.com",
      displayName: "Test User",
      password: "password123",
    };

    const result = await createUser(context, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const user = result.value;
      expect(user.email).toBe(input.email);
      expect(user.displayName).toBe(input.displayName);
      expect(user.hashedPassword).toBe("hashed:password123");
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    }
  });

  it("should fail with invalid email", async () => {
    const input: CreateUserInput = {
      email: "invalid-email",
      displayName: "Test User",
      password: "password123",
    };

    const result = await createUser(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Invalid user input");
    }
  });

  it("should fail with short password", async () => {
    const input: CreateUserInput = {
      email: "test@example.com",
      displayName: "Test User",
      password: "123",
    };

    const result = await createUser(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Invalid user input");
    }
  });

  it("should fail with empty display name", async () => {
    const input: CreateUserInput = {
      email: "test@example.com",
      displayName: "",
      password: "password123",
    };

    const result = await createUser(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Invalid user input");
    }
  });

  it("should fail when user with email already exists", async () => {
    // Seed an existing user
    const existingUser = {
      id: "existing-id" as UserId,
      email: "test@example.com",
      displayName: "Existing User",
      hashedPassword: "hashed:existing",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUserRepository.seed([existingUser]);

    const input: CreateUserInput = {
      email: "test@example.com",
      displayName: "Test User",
      password: "password123",
    };

    const result = await createUser(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("User with this email already exists");
    }
  });
});
