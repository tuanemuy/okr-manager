import { BcryptPasswordHasher } from "@/core/adapters/bcrypt/passwordHasher";
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
import { z } from "zod/v4";

export const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1),
  TURSO_AUTH_TOKEN: z.string().min(1),
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

const db = getDatabase(env.data.TURSO_DATABASE_URL, env.data.TURSO_AUTH_TOKEN);

export const context: Context = {
  userRepository: new DrizzleSqliteUserRepository(db),
  passwordHasher: new BcryptPasswordHasher(),
  sessionManager: new NextAuthSessionManager(),
  authService: new NextAuthService(),
  teamRepository: new DrizzleSqliteTeamRepository(db),
  teamMemberRepository: new DrizzleSqliteTeamMemberRepository(db),
  invitationRepository: new DrizzleSqliteInvitationRepository(db),
  okrRepository: new DrizzleSqliteOkrRepository(db),
  keyResultRepository: new DrizzleSqliteKeyResultRepository(db),
  reviewRepository: new DrizzleSqliteReviewRepository(db),
};
