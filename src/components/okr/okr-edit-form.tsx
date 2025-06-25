"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import {
  addKeyResultAction,
  deleteKeyResultAction,
  type UpdateKeyResultInput,
  type UpdateOkrInput,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { KeyResult, OkrWithKeyResults } from "@/core/domain/okr/types";

const updateOkrFormSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください"),
  description: z
    .string()
    .max(1000, "説明は1000文字以内で入力してください")
    .optional(),
});

const updateKeyResultFormSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください"),
  targetValue: z
    .number()
    .min(0.01, "目標値は0より大きい値を入力してください")
    .max(999999, "目標値が大きすぎます"),
  currentValue: z
    .number()
    .min(0, "現在値は0以上の値を入力してください")
    .max(999999, "現在値が大きすぎます"),
  unit: z.string().max(20, "単位は20文字以内で入力してください").optional(),
});

const addKeyResultFormSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください"),
  targetValue: z
    .number()
    .min(0.01, "目標値は0より大きい値を入力してください")
    .max(999999, "目標値が大きすぎます"),
  unit: z.string().max(20, "単位は20文字以内で入力してください").optional(),
});

type UpdateOkrFormValues = z.infer<typeof updateOkrFormSchema>;
type UpdateKeyResultFormValues = z.infer<typeof updateKeyResultFormSchema>;
type AddKeyResultFormValues = z.infer<typeof addKeyResultFormSchema>;

interface OkrEditFormProps {
  teamId: string;
  okr: OkrWithKeyResults;
  keyResults: KeyResult[];
}

export function OkrEditForm({
  teamId: _teamId,
  okr,
  keyResults: initialKeyResults,
}: OkrEditFormProps) {
  const [keyResults, setKeyResults] = useState(initialKeyResults);
  const [editingKeyResult, setEditingKeyResult] = useState<KeyResult | null>(
    null,
  );
  const [isAddingKeyResult, setIsAddingKeyResult] = useState(false);
  const [deletingKeyResult, setDeletingKeyResult] = useState<KeyResult | null>(
    null,
  );

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const okrForm = useForm<UpdateOkrFormValues>({
    resolver: zodResolver(updateOkrFormSchema),
    defaultValues: {
      title: okr.title,
      description: okr.description || "",
    },
  });

  const keyResultForm = useForm<UpdateKeyResultFormValues>({
    resolver: zodResolver(updateKeyResultFormSchema),
    defaultValues: {
      title: "",
      targetValue: 0,
      currentValue: 0,
      unit: "",
    },
  });

  const addKeyResultForm = useForm<AddKeyResultFormValues>({
    resolver: zodResolver(addKeyResultFormSchema),
    defaultValues: {
      title: "",
      targetValue: 1,
      unit: "",
    },
  });

  const handleOkrUpdate = (values: UpdateOkrFormValues) => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      try {
        const updateData: UpdateOkrInput = {};
        if (values.title !== okr.title) updateData.title = values.title;
        if (values.description !== (okr.description || "")) {
          updateData.description = values.description || undefined;
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
    keyResultForm.reset({
      title: keyResult.title,
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue,
      unit: keyResult.unit || "",
    });
  };

  const handleKeyResultUpdate = (values: UpdateKeyResultFormValues) => {
    if (!editingKeyResult) return;

    startTransition(async () => {
      setError(null);

      try {
        const updateData: UpdateKeyResultInput = {};
        if (values.title !== editingKeyResult.title) {
          updateData.title = values.title;
        }
        if (values.targetValue !== editingKeyResult.targetValue) {
          updateData.targetValue = values.targetValue;
        }
        if (values.currentValue !== editingKeyResult.currentValue) {
          updateData.currentValue = values.currentValue;
        }
        if (values.unit !== (editingKeyResult.unit || "")) {
          updateData.unit = values.unit || undefined;
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

  const handleAddKeyResult = (values: AddKeyResultFormValues) => {
    startTransition(async () => {
      setError(null);

      try {
        const formData = new FormData();
        formData.set("title", values.title);
        formData.set("targetValue", values.targetValue.toString());
        formData.set("unit", values.unit || "");

        await addKeyResultAction(okr.id, formData);

        // Reset form
        addKeyResultForm.reset();
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
        <CardContent>
          <Form {...okrForm}>
            <form
              onSubmit={okrForm.handleSubmit(handleOkrUpdate)}
              className="space-y-4"
            >
              <FormField
                control={okrForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="OKRのタイトル"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={okrForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="OKRの詳細説明（任意）"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "更新中..." : "基本情報を更新"}
              </Button>
            </form>
          </Form>
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
            {keyResults.map((keyResult, _index) => (
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
          <Form {...keyResultForm}>
            <form
              onSubmit={keyResultForm.handleSubmit(handleKeyResultUpdate)}
              className="space-y-4"
            >
              <FormField
                control={keyResultForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                      <Input placeholder="Key Resultのタイトル" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={keyResultForm.control}
                  name="currentValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>現在値</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={keyResultForm.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>目標値</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={keyResultForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>単位（任意）</FormLabel>
                    <FormControl>
                      <Input placeholder="例：件、%、時間" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingKeyResult(null)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              onClick={() =>
                keyResultForm.handleSubmit(handleKeyResultUpdate)()
              }
              disabled={isPending}
            >
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
          <Form {...addKeyResultForm}>
            <form
              onSubmit={addKeyResultForm.handleSubmit(handleAddKeyResult)}
              className="space-y-4"
            >
              <FormField
                control={addKeyResultForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                      <Input placeholder="Key Resultのタイトル" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addKeyResultForm.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目標値</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addKeyResultForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>単位（任意）</FormLabel>
                    <FormControl>
                      <Input placeholder="例：件、%、時間" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddingKeyResult(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              onClick={() =>
                addKeyResultForm.handleSubmit(handleAddKeyResult)()
              }
              disabled={isPending}
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
