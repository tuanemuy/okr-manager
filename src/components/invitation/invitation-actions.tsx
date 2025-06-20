"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  acceptInvitationAction,
  rejectInvitationAction,
} from "@/actions/invitation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InvitationWithTeam } from "@/core/domain/team/types";

interface InvitationActionsProps {
  invitation: InvitationWithTeam;
}

export function InvitationActions({ invitation }: InvitationActionsProps) {
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin: "管理者",
      member: "メンバー",
      viewer: "閲覧者",
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const handleAcceptInvitation = () => {
    startTransition(async () => {
      setError(null);
      try {
        await acceptInvitationAction(invitation.id);
        setIsAcceptDialogOpen(false);
        router.push("/teams");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  const handleRejectInvitation = () => {
    startTransition(async () => {
      setError(null);
      try {
        await rejectInvitationAction(invitation.id);
        setIsRejectDialogOpen(false);
        router.push("/invitations");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  return (
    <>
      <div className="flex gap-3">
        <Button
          onClick={() => setIsAcceptDialogOpen(true)}
          disabled={isPending}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-2" />
          招待を承認してチームに参加
        </Button>
        <Button
          onClick={() => setIsRejectDialogOpen(true)}
          variant="outline"
          disabled={isPending}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          招待を拒否
        </Button>
      </div>

      {/* Accept Invitation Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>招待を承認</DialogTitle>
            <DialogDescription>
              「{invitation.team.name}」への招待を承認しますか？
              承認すると、このチームの{getRoleBadge(invitation.role)}
              として参加し、チームのOKRにアクセスできるようになります。
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAcceptDialogOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button onClick={handleAcceptInvitation} disabled={isPending}>
              {isPending ? "処理中..." : "承認してチームに参加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Invitation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>招待を拒否</DialogTitle>
            <DialogDescription>
              「{invitation.team.name}」への招待を拒否しますか？
              拒否すると、この招待は無効になり、後で再度招待される必要があります。
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectInvitation}
              disabled={isPending}
            >
              {isPending ? "処理中..." : "拒否"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
