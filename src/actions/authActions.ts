"use server";

import * as getSessionUseCase from "@/core/application/auth/getSession";
import * as signInUseCase from "@/core/application/auth/signIn";
import * as signOutUseCase from "@/core/application/auth/signOut";
import { redirect } from "next/navigation";
import { context } from "./context";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await signInUseCase.signIn(context, { email, password });

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
