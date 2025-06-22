"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { context } from "@/context";
import { createUser } from "@/core/application/user/createUser";

export async function signupAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const displayName = formData.get("displayName");

  if (!email || !password || !displayName) {
    throw new Error("All fields are required");
  }

  const result = await createUser(context, {
    email: String(email),
    password: String(password),
    displayName: String(displayName),
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  redirect("/auth/login");
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  try {
    const authResult = context.authService.getHandlers();
    await authResult.signIn("credentials", {
      email: String(email),
      password: String(password),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          throw new Error("Invalid credentials");
        default:
          throw new Error("Authentication failed");
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  const authResult = context.authService.getHandlers();
  await authResult.signOut({ redirectTo: "/auth/login" });
}
