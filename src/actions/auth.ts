"use server";

import { signIn, signOut } from "@/auth";
import { createUser } from "@/core/application/user/createUser";
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

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    throw new Error("Invalid credentials");
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/auth/login" });
}
