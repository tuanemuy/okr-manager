"use server";

import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { context } from "@/context";
import * as getSessionUseCase from "@/core/application/auth/getSession";
import * as signInUseCase from "@/core/application/auth/signIn";
import * as signOutUseCase from "@/core/application/auth/signOut";
import { validate } from "@/lib/validation";

const signInFormSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードは必須です"),
});

export async function signInAction(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = validate(signInFormSchema, rawData);
  if (validation.isErr()) {
    throw new Error(validation.error.message);
  }

  const result = await signInUseCase.signIn(context, {
    email: validation.value.email,
    password: validation.value.password,
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
