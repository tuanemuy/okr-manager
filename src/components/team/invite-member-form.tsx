"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { inviteToTeamAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const inviteFormSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteMemberFormProps {
  teamId: string;
}

export function InviteMemberForm({ teamId }: InviteMemberFormProps) {
  const [formState, formAction, isPending] = useActionState(
    inviteToTeamAction,
    { input: { email: null, teamId: teamId }, error: null } as const,
  );
  const router = useRouter();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: InviteFormValues) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("teamId", teamId);
      formAction(formData);
      if (!formState.error) {
        form.reset();
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      {formState.error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {formState.error.message || "エラーが発生しました"}
        </div>
      )}
      {formState.result && (
        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
          招待を送信しました。メンバーに招待メールが送信されました。
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="招待するメールアドレス"
                    type="email"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            <Mail className="h-4 w-4 mr-2" />
            {isPending ? "送信中..." : "招待を送信"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
