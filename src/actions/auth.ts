"use server";

import { context } from "@/context";
import { createUser } from "@/core/application/user/createUser";
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
    const handlers = context.authService.getHandlers() as {
      signIn: (
        provider: string,
        options: { email: string; password: string; redirectTo: string },
      ) => Promise<void>;
    };
    await handlers.signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    throw new Error("Invalid credentials");
  }
}

export async function logoutAction() {
  const handlers = context.authService.getHandlers() as {
    signOut: (options: { redirectTo: string }) => Promise<void>;
  };
  await handlers.signOut({ redirectTo: "/auth/login" });
}
