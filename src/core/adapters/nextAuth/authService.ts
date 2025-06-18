import { auth, signIn, signOut } from "@/auth";
import type { AuthService } from "@/core/domain/auth/ports/authService";
import {
  AuthenticationError,
  type SessionData,
  SessionError,
  type SignInCredentials,
} from "@/core/domain/auth/types";
import { type Result, err, ok } from "neverthrow";

export class NextAuthService implements AuthService {
  async signIn(
    credentials: SignInCredentials,
  ): Promise<Result<SessionData, AuthenticationError>> {
    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (!result) {
        return err(new AuthenticationError("Invalid credentials"));
      }

      const session = await this.getSession();
      if (session.isErr()) {
        return err(
          new AuthenticationError(
            "Failed to get session after sign in",
            session.error,
          ),
        );
      }

      if (!session.value) {
        return err(new AuthenticationError("No session created after sign in"));
      }

      return ok(session.value);
    } catch (error) {
      return err(new AuthenticationError("Sign in failed", error));
    }
  }

  async signOut(): Promise<Result<void, AuthenticationError>> {
    try {
      await signOut({ redirect: false });
      return ok(undefined);
    } catch (error) {
      return err(new AuthenticationError("Sign out failed", error));
    }
  }

  async getSession(): Promise<Result<SessionData | null, SessionError>> {
    try {
      const session = await auth();

      if (!session) {
        return ok(null);
      }

      if (
        !session.user?.id ||
        !session.user?.email ||
        !session.user?.name ||
        !session.expires
      ) {
        return err(new SessionError("Invalid session data structure"));
      }

      const sessionData: SessionData = {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        expires: session.expires,
      };

      return ok(sessionData);
    } catch (error) {
      return err(new SessionError("Failed to get session", error));
    }
  }
}
