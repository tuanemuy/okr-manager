import { z } from "zod/v4";

export const sessionDataSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
  expires: z.string(),
});
export type SessionData = z.infer<typeof sessionDataSchema>;

export const signInCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type SignInCredentials = z.infer<typeof signInCredentialsSchema>;

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class SessionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SessionError";
  }
}
