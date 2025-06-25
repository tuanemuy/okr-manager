"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod/v4";
import { context } from "@/context";
import { createUser } from "@/core/application/user/createUser";
import type { FormState } from "@/lib/formState";
import { validate } from "@/lib/validation";

const signupFormSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    displayName: z.string().min(1).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type SignupFormData = {
  email: FormDataEntryValue | null;
  password: FormDataEntryValue | null;
  displayName: FormDataEntryValue | null;
  confirmPassword: FormDataEntryValue | null;
};

export async function signupAction(
  _prevState: FormState<SignupFormData, { success: boolean }>,
  formData: FormData,
): Promise<FormState<SignupFormData, { success: boolean }>> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = validate(signupFormSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const result = await createUser(context, {
    email: validation.value.email,
    password: validation.value.password,
    displayName: validation.value.displayName,
  });

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  redirect("/auth/login");
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const validationResult = validate(loginFormSchema, {
    email,
    password,
  });

  if (validationResult.isErr()) {
    throw new Error(validationResult.error.message);
  }

  const validInput = validationResult.value;

  try {
    const authResult = context.authService.getHandlers();
    await authResult.signIn("credentials", {
      email: validInput.email,
      password: validInput.password,
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
