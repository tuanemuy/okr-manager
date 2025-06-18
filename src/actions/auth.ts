"use server";

import { createUser } from "@/core/application/user/createUser";
import { loginUser } from "@/core/application/user/loginUser";
import { redirect } from "next/navigation";
import { context } from "./context";

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

  const result = await loginUser(context, {
    email,
    password,
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  const user = result.value;

  const sessionResult = await context.sessionManager.create({
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
  });

  if (sessionResult.isErr()) {
    throw new Error("Failed to create session");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const result = await context.sessionManager.destroy();

  if (result.isErr()) {
    console.error("Logout error:", result.error);
  }

  redirect("/auth/login");
}
