import { BcryptPasswordHasher } from "@/core/adapters/bcrypt/passwordHasher";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { users } from "@/core/adapters/drizzleSqlite/schema";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod/v4";

const envSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  DATABASE_FILE_NAME: z.string(),
});

const env = envSchema.parse(process.env);

const db = getDatabase(env.DATABASE_FILE_NAME);
const passwordHasher = new BcryptPasswordHasher();

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        if (!email || !password) {
          return null;
        }

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email as string))
            .limit(1);

          if (!user) {
            return null;
          }

          const isValidPassword = await passwordHasher.verify(
            password as string,
            user.hashedPassword,
          );

          if (!isValidPassword.isOk() || !isValidPassword.value) {
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
});
