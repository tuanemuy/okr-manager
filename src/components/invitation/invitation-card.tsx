"use client";

import {
  acceptInvitationAction,
  rejectInvitationAction,
} from "@/actions/invitation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InvitationWithTeam } from "@/core/domain/team/types";
import { Calendar, Check, ExternalLink, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface InvitationCardProps {
  invitation: InvitationWithTeam;
}

export function InvitationCard({ invitation }: InvitationCardProps) {
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
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {invitation.team.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4" />
                {invitation.invitedBy.displayName}から招待されました（
                {invitation.createdAt.toLocaleDateString("ja-JP")}）
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant="secondary">保留中</Badge>
              <Badge variant="outline">{getRoleBadge(invitation.role)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invitation.team.description && (
              <div>
                <h4 className="font-medium mb-2">チームについて</h4>
                <p className="text-sm text-muted-foreground">
                  {invitation.team.description}
                </p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setIsAcceptDialogOpen(true)}
                size="sm"
                disabled={isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                招待を承認
              </Button>
              <Button
                onClick={() => setIsRejectDialogOpen(true)}
                variant="outline"
                size="sm"
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-2" />
                招待を拒否
              </Button>
              <Link href={`/invitations/${invitation.id}`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  詳細を表示
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accept Invitation Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>招待を承認</DialogTitle>
            <DialogDescription>
              「{invitation.team.name}」への招待を承認しますか？
              承認すると、このチームの{getRoleBadge(invitation.role)}
              として参加します。
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
              {isPending ? "処理中..." : "承認"}
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
              この操作は取り消すことができません。
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
