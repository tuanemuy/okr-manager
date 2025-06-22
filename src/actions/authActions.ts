"use server";

import { redirect } from "next/navigation";
import { context } from "@/context";
import * as getSessionUseCase from "@/core/application/auth/getSession";
import * as signInUseCase from "@/core/application/auth/signIn";
import * as signOutUseCase from "@/core/application/auth/signOut";

export async function signInAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const result = await signInUseCase.signIn(context, {
    email: String(email),
    password: String(password),
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const result = await signOutUseCase.signOut(context);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  redirect("/auth/login");
}

export async function getCurrentSession() {
  const result = await getSessionUseCase.getSession(context);

  if (result.isErr()) {
    return null;
  }

  return result.value;
}
