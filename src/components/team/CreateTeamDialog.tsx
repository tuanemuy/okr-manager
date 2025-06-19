"use client";

import { createTeamAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface CreateTeamDialogProps {
  children: React.ReactNode;
}

export function CreateTeamDialog({ children }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新しいチーム作成</DialogTitle>
          <DialogDescription>
            チーム名と説明を入力して、新しいチームを作成してください。
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createTeamAction(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">チーム名</Label>
            <Input
              id="name"
              name="name"
              placeholder="チーム名を入力"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">説明（任意）</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="チームの説明を入力"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
