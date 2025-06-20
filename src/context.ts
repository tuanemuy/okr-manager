import type { NextAuthResult } from "next-auth";
import { z } from "zod/v4";
import { BcryptPasswordHasher } from "@/core/adapters/bcryptjs/passwordHasher";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { DrizzleSqliteInvitationRepository } from "@/core/adapters/drizzleSqlite/invitationRepository";
import { DrizzleSqliteKeyResultRepository } from "@/core/adapters/drizzleSqlite/keyResultRepository";
import { DrizzleSqliteOkrRepository } from "@/core/adapters/drizzleSqlite/okrRepository";
import { DrizzleSqliteReviewRepository } from "@/core/adapters/drizzleSqlite/reviewRepository";
import { DrizzleSqliteTeamMemberRepository } from "@/core/adapters/drizzleSqlite/teamMemberRepository";
import { DrizzleSqliteTeamRepository } from "@/core/adapters/drizzleSqlite/teamRepository";
import { DrizzleSqliteUserRepository } from "@/core/adapters/drizzleSqlite/userRepository";
import { NextAuthService } from "@/core/adapters/nextAuth/authService";
import { NextAuthSessionManager } from "@/core/adapters/nextAuth/sessionManager";
import type { Context } from "@/core/application/context";

export const envSchema = z.object({
  NEXT_PUBLIC_URL: z.string().url(),
  // TURSO_DATABASE_URL: z.string().min(1),
  // TURSO_AUTH_TOKEN: z.string().min(1),
  SQLITE_FILEPATH: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.safeParse(process.env);
if (!env.success) {
  const errors = env.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Environment validation failed: ${errors}`);
}

const db = getDatabase(env.data.SQLITE_FILEPATH);
const userRepository = new DrizzleSqliteUserRepository(db);
const passwordHasher = new BcryptPasswordHasher();
const authService = new NextAuthService(userRepository, passwordHasher, db);
const sessionManager = new NextAuthSessionManager(authService);

export const context: Context<NextAuthResult> = {
  publicUrl: env.data.NEXT_PUBLIC_URL,
  userRepository,
  passwordHasher,
  sessionManager,
  authService,
  teamRepository: new DrizzleSqliteTeamRepository(db),
  teamMemberRepository: new DrizzleSqliteTeamMemberRepository(db),
  invitationRepository: new DrizzleSqliteInvitationRepository(db),
  okrRepository: new DrizzleSqliteOkrRepository(db),
  keyResultRepository: new DrizzleSqliteKeyResultRepository(db),
  reviewRepository: new DrizzleSqliteReviewRepository(db),
};
