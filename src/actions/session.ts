"use server";

import { redirect } from "next/navigation";
import { context } from "./context";

export async function getSession() {
  const sessionResult = await context.sessionManager.get();

  if (sessionResult.isErr()) {
    console.error("Session error:", sessionResult.error);
    return null;
  }

  return sessionResult.value;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return session;
}

export async function logout() {
  const result = await context.sessionManager.destroy();

  if (result.isErr()) {
    console.error("Logout error:", result.error);
    throw new Error("Failed to logout");
  }

  redirect("/auth/login");
}
