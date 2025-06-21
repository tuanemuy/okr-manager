"use client";

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteToTeamAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteMemberFormProps {
  teamId: string;
}

export function InviteMemberForm({ teamId }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      try {
        await inviteToTeamAction(teamId, formData);
        setEmail("");
        setSuccess(
          "招待を送信しました。メンバーに招待メールが送信されました。",
        );
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "不明なエラー");
      }
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
          {success}
        </div>
      )}
      <form action={handleSubmit} className="flex space-x-2">
        <Input
          name="email"
          placeholder="招待するメールアドレス"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !email.trim()}>
          <Mail className="h-4 w-4 mr-2" />
          {isPending ? "送信中..." : "招待を送信"}
        </Button>
      </form>
    </div>
  );
}
