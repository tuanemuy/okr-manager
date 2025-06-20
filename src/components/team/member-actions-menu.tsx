"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  removeTeamMemberAction,
  updateTeamMemberRoleAction,
} from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamMemberWithUser } from "@/core/domain/team/types";

interface MemberActionsMenuProps {
  teamId: string;
  member: TeamMemberWithUser;
}

export function MemberActionsMenu({ teamId, member }: MemberActionsMenuProps) {
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleChange = () => {
    if (selectedRole === member.role) return;

    startTransition(async () => {
      setError(null);

      try {
        const result = await updateTeamMemberRoleAction(
          teamId,
          member.userId,
          selectedRole as "admin" | "member" | "viewer",
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        setIsRoleDialogOpen(false);
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  const handleRemoveMember = () => {
    startTransition(async () => {
      setError(null);

      try {
        const result = await removeTeamMemberAction(teamId, member.userId);

        if (!result.success) {
          throw new Error(result.error);
        }

        setIsRemoveDialogOpen(false);
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  const getRoleLabel = (role: string) => {
    const roleMap = {
      admin: "管理者",
      member: "メンバー",
      viewer: "閲覧者",
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
            役割を変更
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setIsRemoveDialogOpen(true)}
          >
            メンバーを削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>役割の変更</DialogTitle>
            <DialogDescription>
              {member.user.displayName}の役割を変更してください。
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="py-4">
            <label htmlFor="role-select" className="text-sm font-medium">
              役割
            </label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as "admin" | "member" | "viewer")
              }
            >
              <SelectTrigger id="role-select" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理者</SelectItem>
                <SelectItem value="member">メンバー</SelectItem>
                <SelectItem value="viewer">閲覧者</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={isPending || selectedRole === member.role}
            >
              {isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーの削除</DialogTitle>
            <DialogDescription>
              {member.user.displayName}をチームから削除しますか？
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
              onClick={() => setIsRemoveDialogOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isPending}
            >
              {isPending ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
