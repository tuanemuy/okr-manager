"use server";

import { context } from "@/context";
import { createUser } from "@/core/application/user/createUser";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  const result = await createUser(context, {
    email,
    password,
    displayName,
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  redirect("/auth/login");
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const authResult = context.authService.getHandlers();
    await authResult.signIn("credentials", {
      email,
      password,
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
