import type { AuthService } from "@/core/domain/auth/ports/authService";
import {
  AuthenticationError,
  type SessionData,
  SessionError,
  type SignInCredentials,
  sessionDataSchema,
} from "@/core/domain/auth/types";
import type { PasswordHasher } from "@/core/domain/user/ports/passwordHasher";
import type { UserRepository } from "@/core/domain/user/ports/userRepository";
import { validate } from "@/lib/validation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type Result, err, ok } from "neverthrow";
import NextAuth, { type NextAuthConfig, type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod/v4";
import type { Database } from "../drizzleSqlite/client";

const envSchema = z.object({
  AUTH_SECRET: z.string().min(32),
});

export class NextAuthService implements AuthService<NextAuthResult> {
  private nextAuth: ReturnType<typeof NextAuth>;

  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private db: Database,
  ) {
    const env = envSchema.parse(process.env);

    const config: NextAuthConfig = {
      adapter: DrizzleAdapter(db),
      providers: [
        Credentials({
          name: "credentials",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          authorize: async (credentials) => {
            const { email, password } = credentials;

            if (!email || !password) {
              return null;
            }

            try {
              const userResult = await this.userRepository.getByEmail(
                email as string,
              );

              if (userResult.isErr() || !userResult.value) {
                return null;
              }

              const user = userResult.value;
              const isValidPassword = await this.passwordHasher.verify(
                password as string,
                user.hashedPassword,
              );

              if (isValidPassword.isErr() || !isValidPassword.value) {
                return null;
              }

              return {
                id: user.id,
                email: user.email,
                name: user.displayName,
              };
            } catch (error) {
              console.error("Authentication error:", error);
              return null;
            }
          },
        }),
      ],
      session: {
        strategy: "jwt",
      },
      pages: {
        signIn: "/auth/login",
      },
      callbacks: {
        async jwt({ token, user }) {
          if (user) {
            token.id = user.id;
          }
          return token;
        },
        async session({ session, token }) {
          if (token.id) {
            session.user.id = token.id as string;
          }
          return session;
        },
      },
      secret: env.AUTH_SECRET,
    };

    this.nextAuth = NextAuth(config);
  }

  async signIn(
    credentials: SignInCredentials,
  ): Promise<Result<SessionData, AuthenticationError>> {
    try {
      return err(
        new AuthenticationError("Not implemented - use NextAuth flow"),
      );
    } catch (error) {
      return err(new AuthenticationError("Sign-in failed", error));
    }
  }

  async signOut(): Promise<Result<void, AuthenticationError>> {
    try {
      await this.nextAuth.signOut();
      return ok(undefined);
    } catch (error) {
      return err(new AuthenticationError("Sign-out failed", error));
    }
  }

  async getSession(): Promise<Result<SessionData | null, SessionError>> {
    try {
      const session = await this.nextAuth.auth();

      if (!session) {
        return ok(null);
      }

      const validationResult = validate(sessionDataSchema, session);

      return validationResult.mapErr(
        (error) => new SessionError("Invalid session data", error),
      );
    } catch (error) {
      return err(new SessionError("Failed to get session", error));
    }
  }

  getHandlers(): NextAuthResult {
    return this.nextAuth;
  }
}
