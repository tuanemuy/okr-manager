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
import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

interface MockHandlers {
  auth: () => SessionData | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  handlers: {
    GET: () => Promise<Response>;
    POST: () => Promise<Response>;
  };
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
    return {
      auth: () => this.currentSession,
      signIn: async () => Promise.resolve(),
      signOut: async () => Promise.resolve(),
      handlers: {
        GET: async () => new Response(),
        POST: async () => new Response(),
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
