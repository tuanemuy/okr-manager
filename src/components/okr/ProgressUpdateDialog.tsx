"use client";

import { updateKeyResultProgressAction } from "@/actions/okr";
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
import { Edit } from "lucide-react";
import { useState, useTransition } from "react";

interface ProgressUpdateDialogProps {
  keyResult: {
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit?: string;
  };
}

export function ProgressUpdateDialog({ keyResult }: ProgressUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(keyResult.currentValue);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateKeyResultProgressAction(keyResult.id, formData);
        setOpen(false);
      } catch (error) {
        console.error("Failed to update progress:", error);
        alert("進捗の更新に失敗しました");
      }
    });
  };

  const progress =
    keyResult.targetValue > 0
      ? (currentValue / keyResult.targetValue) * 100
      : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Edit className="h-3 w-3 mr-1" />
          更新
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>進捗を更新</DialogTitle>
          <DialogDescription>{keyResult.title}</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentValue">現在値</Label>
            <div className="flex items-center gap-2">
              <Input
                id="currentValue"
                name="currentValue"
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                placeholder="進捗値を入力"
                min="0"
                step="0.01"
                required
              />
              {keyResult.unit && (
                <span className="text-sm text-muted-foreground">
                  {keyResult.unit}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              目標値: {keyResult.targetValue}
              {keyResult.unit && ` ${keyResult.unit}`}
            </div>
          </div>

          <div className="space-y-2">
            <Label>進捗率</Label>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "更新中..." : "更新"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
