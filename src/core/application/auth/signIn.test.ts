import { beforeEach, describe, expect, it } from "vitest";
import { MockAuthService } from "@/core/adapters/mock/authService";
import type { Context } from "../context";
import { type SignInInput, signIn } from "./signIn";

describe("signIn", () => {
  let context: Context;
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    mockAuthService = new MockAuthService();

    context = {
      authService: mockAuthService,
    } as unknown as Context;
  });

  it("should sign in successfully with valid credentials", async () => {
    const email = "test@example.com";
    const password = "password123";

    mockAuthService.setValidCredentials(email, password);

    const input: SignInInput = {
      email,
      password,
    };

    const result = await signIn(context, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const sessionData = result.value;
      expect(sessionData.user.email).toBe(email);
      expect(sessionData.user.name).toBe("Mock User");
      expect(sessionData.user.id).toBeDefined();
    }
  });

  it("should fail with invalid credentials", async () => {
    const input: SignInInput = {
      email: "test@example.com",
      password: "wrongpassword",
    };

    const result = await signIn(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Invalid credentials");
    }
  });

  it("should fail with invalid email format", async () => {
    const input: SignInInput = {
      email: "invalid-email",
      password: "password123",
    };

    const result = await signIn(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Invalid sign in input");
    }
  });

  it("should fail with missing password", async () => {
    const input = {
      email: "test@example.com",
      // missing password
    } as SignInInput;

    const result = await signIn(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Invalid sign in input");
    }
  });
});
