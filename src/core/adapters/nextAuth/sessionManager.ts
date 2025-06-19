import { auth, signOut } from "@/auth";
import type {
  SessionData,
  SessionManager,
} from "@/core/domain/user/ports/sessionManager";
import { ApplicationError } from "@/lib/error";
import { type Result, err, ok } from "neverthrow";

export class NextAuthSessionManager implements SessionManager {
  async get(): Promise<Result<SessionData | null, ApplicationError>> {
    try {
      const session = await auth();

      if (!session?.user?.id || !session?.user?.email || !session?.user?.name) {
        return ok(null);
      }

      return ok({
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        expires: session.expires,
      });
    } catch (error) {
      return err(new ApplicationError("Failed to get session", error));
    }
  }

  async create(
    sessionData: SessionData,
  ): Promise<Result<void, ApplicationError>> {
    // Auth.js handles session creation during signIn flow
    // This method is kept for interface compatibility but does nothing
    return ok(undefined);
  }

  async destroy(): Promise<Result<void, ApplicationError>> {
    try {
      await signOut({ redirect: false });
      return ok(undefined);
    } catch (error) {
      return err(new ApplicationError("Failed to destroy session", error));
    }
  }
}
