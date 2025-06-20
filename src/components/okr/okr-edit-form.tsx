"use client";

import {
  type UpdateKeyResultInput,
  type UpdateOkrInput,
  addKeyResultAction,
  deleteKeyResultAction,
  updateKeyResultAction,
  updateOkrAction,
} from "@/actions/okr";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KeyResult, OkrWithKeyResults } from "@/core/domain/okr/types";
import { Edit2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface OkrEditFormProps {
  teamId: string;
  okr: OkrWithKeyResults;
  keyResults: KeyResult[];
}

export function OkrEditForm({
  teamId,
  okr,
  keyResults: initialKeyResults,
}: OkrEditFormProps) {
  const [title, setTitle] = useState(okr.title);
  const [description, setDescription] = useState(okr.description || "");
  const [keyResults, setKeyResults] = useState(initialKeyResults);
  const [editingKeyResult, setEditingKeyResult] = useState<KeyResult | null>(
    null,
  );
  const [isAddingKeyResult, setIsAddingKeyResult] = useState(false);
  const [deletingKeyResult, setDeletingKeyResult] = useState<KeyResult | null>(
    null,
  );
  const [newKeyResult, setNewKeyResult] = useState({
    title: "",
    targetValue: 0,
    unit: "",
  });
  const [editingKeyResultData, setEditingKeyResultData] = useState<{
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
  }>({
    title: "",
    targetValue: 0,
    currentValue: 0,
    unit: "",
  });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleOkrUpdate = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      try {
        const updateData: UpdateOkrInput = {};
        if (title !== okr.title) updateData.title = title;
        if (description !== (okr.description || "")) {
          updateData.description = description || undefined;
        }

        if (Object.keys(updateData).length === 0) {
          setSuccess("変更はありませんでした。");
          return;
        }

        const result = await updateOkrAction(okr.id, updateData);
        if (!result.success) {
          throw new Error(result.error);
        }

        setSuccess("OKRを更新しました。");
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  const handleKeyResultEdit = (keyResult: KeyResult) => {
    setEditingKeyResult(keyResult);
    setEditingKeyResultData({
      title: keyResult.title,
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue,
      unit: keyResult.unit || "",
    });
  };

  const handleKeyResultUpdate = () => {
    if (!editingKeyResult) return;

    startTransition(async () => {
      setError(null);

      try {
        const updateData: UpdateKeyResultInput = {};
        if (editingKeyResultData.title !== editingKeyResult.title) {
          updateData.title = editingKeyResultData.title;
        }
        if (editingKeyResultData.targetValue !== editingKeyResult.targetValue) {
          updateData.targetValue = editingKeyResultData.targetValue;
        }
        if (
          editingKeyResultData.currentValue !== editingKeyResult.currentValue
        ) {
          updateData.currentValue = editingKeyResultData.currentValue;
        }
        if (editingKeyResultData.unit !== (editingKeyResult.unit || "")) {
          updateData.unit = editingKeyResultData.unit || undefined;
        }

        if (Object.keys(updateData).length === 0) {
          setEditingKeyResult(null);
          return;
        }

        const result = await updateKeyResultAction(
          editingKeyResult.id,
          updateData,
        );
        if (!result.success) {
          throw new Error(result.error);
        }

        // Update local state
        setKeyResults((prev) =>
          prev.map((kr) =>
            kr.id === editingKeyResult.id ? { ...kr, ...updateData } : kr,
          ),
        );

        setEditingKeyResult(null);
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  const handleKeyResultDelete = () => {
    if (!deletingKeyResult) return;

    startTransition(async () => {
      setError(null);

      try {
        const result = await deleteKeyResultAction(deletingKeyResult.id);
        if (!result.success) {
          throw new Error(result.error);
        }

        // Update local state
        setKeyResults((prev) =>
          prev.filter((kr) => kr.id !== deletingKeyResult.id),
        );
        setDeletingKeyResult(null);
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  const handleAddKeyResult = () => {
    startTransition(async () => {
      setError(null);

      try {
        const formData = new FormData();
        formData.set("title", newKeyResult.title);
        formData.set("targetValue", newKeyResult.targetValue.toString());
        formData.set("unit", newKeyResult.unit);

        await addKeyResultAction(okr.id, formData);

        // Reset form
        setNewKeyResult({ title: "", targetValue: 0, unit: "" });
        setIsAddingKeyResult(false);
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    });
  };

  return (
    <div className="space-y-6">
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

      {/* OKR Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>OKRのタイトルと説明を編集できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="OKRのタイトル"
              className="mt-1"
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="OKRの詳細説明（任意）"
              className="mt-1"
              disabled={isPending}
            />
          </div>
          <Button onClick={handleOkrUpdate} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "更新中..." : "基本情報を更新"}
          </Button>
        </CardContent>
      </Card>

      {/* Key Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Key Results</CardTitle>
              <CardDescription>
                Key Resultsを編集、追加、削除できます。
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddingKeyResult(true)}
              size="sm"
              disabled={isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keyResults.map((keyResult, index) => (
              <div
                key={keyResult.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{keyResult.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {keyResult.currentValue} / {keyResult.targetValue}
                    {keyResult.unit && ` ${keyResult.unit}`}（
                    {Math.round(
                      (keyResult.currentValue / keyResult.targetValue) * 100,
                    )}
                    %）
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleKeyResultEdit(keyResult)}
                    disabled={isPending}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingKeyResult(keyResult)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {keyResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Key Resultsがありません。追加してください。
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Key Result Dialog */}
      <Dialog
        open={!!editingKeyResult}
        onOpenChange={() => setEditingKeyResult(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Key Resultを編集</DialogTitle>
            <DialogDescription>
              Key Resultの内容を編集してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="kr-title">タイトル</Label>
              <Input
                id="kr-title"
                value={editingKeyResultData.title}
                onChange={(e) =>
                  setEditingKeyResultData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Key Resultのタイトル"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kr-current">現在値</Label>
                <Input
                  id="kr-current"
                  type="number"
                  value={editingKeyResultData.currentValue}
                  onChange={(e) =>
                    setEditingKeyResultData((prev) => ({
                      ...prev,
                      currentValue: Number(e.target.value),
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="kr-target">目標値</Label>
                <Input
                  id="kr-target"
                  type="number"
                  value={editingKeyResultData.targetValue}
                  onChange={(e) =>
                    setEditingKeyResultData((prev) => ({
                      ...prev,
                      targetValue: Number(e.target.value),
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="kr-unit">単位（任意）</Label>
              <Input
                id="kr-unit"
                value={editingKeyResultData.unit}
                onChange={(e) =>
                  setEditingKeyResultData((prev) => ({
                    ...prev,
                    unit: e.target.value,
                  }))
                }
                placeholder="例：件、%、時間"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingKeyResult(null)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button onClick={handleKeyResultUpdate} disabled={isPending}>
              {isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Key Result Dialog */}
      <Dialog open={isAddingKeyResult} onOpenChange={setIsAddingKeyResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Key Resultを追加</DialogTitle>
            <DialogDescription>
              新しいKey Resultを作成してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-kr-title">タイトル</Label>
              <Input
                id="new-kr-title"
                value={newKeyResult.title}
                onChange={(e) =>
                  setNewKeyResult((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Key Resultのタイトル"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-kr-target">目標値</Label>
              <Input
                id="new-kr-target"
                type="number"
                value={newKeyResult.targetValue}
                onChange={(e) =>
                  setNewKeyResult((prev) => ({
                    ...prev,
                    targetValue: Number(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-kr-unit">単位（任意）</Label>
              <Input
                id="new-kr-unit"
                value={newKeyResult.unit}
                onChange={(e) =>
                  setNewKeyResult((prev) => ({ ...prev, unit: e.target.value }))
                }
                placeholder="例：件、%、時間"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddingKeyResult(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddKeyResult}
              disabled={
                isPending ||
                !newKeyResult.title.trim() ||
                newKeyResult.targetValue <= 0
              }
            >
              {isPending ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Key Result Dialog */}
      <Dialog
        open={!!deletingKeyResult}
        onOpenChange={() => setDeletingKeyResult(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Key Resultを削除</DialogTitle>
            <DialogDescription>
              「{deletingKeyResult?.title}」を削除しますか？
              この操作は取り消すことができません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingKeyResult(null)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleKeyResultDelete}
              disabled={isPending}
            >
              {isPending ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
