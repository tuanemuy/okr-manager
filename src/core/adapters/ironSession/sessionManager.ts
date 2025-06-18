import type {
  SessionData,
  SessionManager,
} from "@/core/domain/user/ports/sessionManager";
import type { UserId } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { getIronSession } from "iron-session";
import { type Result, err, ok } from "neverthrow";
import { cookies } from "next/headers";

interface IronSessionData extends SessionData {
  userId: UserId;
  email: string;
  displayName: string;
}

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "default-secret-that-should-be-changed-in-production",
  cookieName: "okr-manager-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export class IronSessionManager implements SessionManager {
  private async getSession() {
    return getIronSession<IronSessionData>(await cookies(), sessionOptions);
  }

  async get(): Promise<Result<SessionData | null, ApplicationError>> {
    try {
      const session = await this.getSession();

      if (!session.userId) {
        return ok(null);
      }

      return ok({
        userId: session.userId,
        email: session.email,
        displayName: session.displayName,
      });
    } catch (error) {
      return err(new ApplicationError("Failed to get session", error));
    }
  }

  async create(
    sessionData: SessionData,
  ): Promise<Result<void, ApplicationError>> {
    try {
      const session = await this.getSession();

      session.userId = sessionData.userId;
      session.email = sessionData.email;
      session.displayName = sessionData.displayName;

      await session.save();
      return ok(undefined);
    } catch (error) {
      return err(new ApplicationError("Failed to create session", error));
    }
  }

  async destroy(): Promise<Result<void, ApplicationError>> {
    try {
      const session = await this.getSession();
      session.destroy();
      return ok(undefined);
    } catch (error) {
      return err(new ApplicationError("Failed to destroy session", error));
    }
  }
}
