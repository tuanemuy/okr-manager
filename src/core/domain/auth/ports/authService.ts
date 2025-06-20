import type { Result } from "neverthrow";
import type {
  AuthenticationError,
  SessionData,
  SessionError,
  SignInCredentials,
} from "../types";

export interface AuthService<THandlers = unknown> {
  signIn(
    credentials: SignInCredentials,
  ): Promise<Result<SessionData, AuthenticationError>>;
  signOut(): Promise<Result<void, AuthenticationError>>;
  getSession(): Promise<Result<SessionData | null, SessionError>>;
  getHandlers(): THandlers;
}
