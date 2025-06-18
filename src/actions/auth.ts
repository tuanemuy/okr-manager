"use server";

import { createUser } from "@/core/application/user/createUser";
import { loginUser } from "@/core/application/user/loginUser";
import { context } from "./context";
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

  const result = await loginUser(context, {
    email,
    password,
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  // TODO: Implement logout with session manager
  redirect("/auth/login");
}
