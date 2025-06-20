import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { NextRequest } from "next/server";
import { v7 as uuidv7 } from "uuid";
import type { AuthService } from "@/core/domain/auth/ports/authService";
import type {
  AuthenticationError,
  SessionData,
  SessionError,
  SignInCredentials,
} from "@/core/domain/auth/types";
import {
  AuthenticationError as AuthError,
  SessionError as SessError,
} from "@/core/domain/auth/types";

interface MockHandlers {
  handlers: {
    GET: (request: Request) => Promise<Response>;
    POST: (request: Request) => Promise<Response>;
  };
  auth: (() => Promise<SessionData | null>) &
    ((handler: (req: NextRequest) => unknown) => unknown);
  signIn: (
    provider: string,
    options?: { email?: string; password?: string; redirectTo?: string },
  ) => Promise<void>;
  signOut: (options?: { redirectTo?: string }) => Promise<void>;
}

export class MockAuthService implements AuthService<MockHandlers> {
  private currentSession: SessionData | null = null;
  private validCredentials: Map<string, string> = new Map();

  async signIn(
    credentials: SignInCredentials,
  ): Promise<Result<SessionData, AuthenticationError>> {
    const validPassword = this.validCredentials.get(credentials.email);

    if (!validPassword || validPassword !== credentials.password) {
      return err(new AuthError("Invalid credentials"));
    }

    this.currentSession = {
      user: {
        id: uuidv7(),
        email: credentials.email,
        name: "Mock User",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return ok(this.currentSession);
  }

  async signOut(): Promise<Result<void, AuthenticationError>> {
    this.currentSession = null;
    return ok(undefined);
  }

  async getSession(): Promise<Result<SessionData | null, SessionError>> {
    return ok(this.currentSession);
  }

  getHandlers(): MockHandlers {
    const mockAuth = (() =>
      Promise.resolve(
        this.currentSession,
      )) as (() => Promise<SessionData | null>) &
      ((handler: (req: NextRequest) => unknown) => unknown);

    return {
      auth: mockAuth,
      signIn: async (
        provider: string,
        options?: { email?: string; password?: string; redirectTo?: string },
      ) => Promise.resolve(),
      signOut: async (options?: { redirectTo?: string }) => Promise.resolve(),
      handlers: {
        GET: async (request: Request) => new Response(),
        POST: async (request: Request) => new Response(),
      },
    };
  }

  // Helper methods for testing
  setValidCredentials(email: string, password: string): void {
    this.validCredentials.set(email, password);
  }

  setCurrentSession(session: SessionData | null): void {
    this.currentSession = session;
  }

  clear(): void {
    this.currentSession = null;
    this.validCredentials.clear();
  }
}
