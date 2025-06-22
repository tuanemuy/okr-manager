"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod/v4";
import { context } from "@/context";
import { createUser } from "@/core/application/user/createUser";
import { validate } from "@/lib/validation";

const signupFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(100),
});

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signupAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const displayName = formData.get("displayName");

  const validationResult = validate(signupFormSchema, {
    email,
    password,
    displayName,
  });

  if (validationResult.isErr()) {
    throw new Error(validationResult.error.message);
  }

  const validInput = validationResult.value;

  const result = await createUser(context, {
    email: validInput.email,
    password: validInput.password,
    displayName: validInput.displayName,
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
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
