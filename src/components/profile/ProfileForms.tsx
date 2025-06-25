"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { updatePasswordAction, updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/core/domain/user/types";

const updateProfileFormSchema = z.object({
  displayName: z
    .string()
    .min(1, "表示名は必須です")
    .max(100, "表示名は100文字以内で入力してください"),
});

const updatePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードは必須です"),
    newPassword: z
      .string()
      .min(8, "新しいパスワードは8文字以上で入力してください")
      .max(100, "新しいパスワードは100文字以内で入力してください"),
    confirmPassword: z
      .string()
      .min(8, "パスワード確認は8文字以上で入力してください")
      .max(100, "パスワード確認は100文字以内で入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "新しいパスワードと確認用パスワードが一致しません",
    path: ["confirmPassword"],
  });

type UpdateProfileFormValues = z.infer<typeof updateProfileFormSchema>;
type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>;

interface ProfileFormsProps {
  user: User;
}

export function ProfileForms({ user }: ProfileFormsProps) {
  const [profileState, profileAction, isProfilePending] = useActionState(
    updateProfileAction,
    { input: { displayName: null }, error: null } as const,
  );

  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    updatePasswordAction,
    {
      input: {
        currentPassword: null,
        newPassword: null,
        confirmPassword: null,
      },
      error: null,
    } as const,
  );

  const profileForm = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      displayName: user.displayName,
    },
  });

  const passwordForm = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = (values: UpdateProfileFormValues) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("displayName", values.displayName);
      profileAction(formData);
    });
  };

  const onPasswordSubmit = (values: UpdatePasswordFormValues) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("currentPassword", values.currentPassword);
      formData.append("newPassword", values.newPassword);
      formData.append("confirmPassword", values.confirmPassword);
      passwordAction(formData);
      // Reset form on submission
      passwordForm.reset();
    });
  };

  return (
    <div className="grid gap-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and display preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileState.error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {profileState.error.message || "エラーが発生しました"}
            </div>
          )}
          {profileState.result && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
              プロフィールを更新しました
            </div>
          )}
          <Form {...profileForm}>
            <form
              action={profileAction}
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <FormDescription>
                  Email address cannot be changed.
                </FormDescription>
              </div>

              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your display name"
                        disabled={isProfilePending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isProfilePending}>
                  {isProfilePending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordState.error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {passwordState.error.message || "エラーが発生しました"}
            </div>
          )}
          {passwordState.result && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
              パスワードを更新しました
            </div>
          )}
          <Form {...passwordForm}>
            <form
              action={passwordAction}
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your current password"
                        disabled={isPasswordPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your new password"
                        disabled={isPasswordPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        disabled={isPasswordPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isPasswordPending}>
                  {isPasswordPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
