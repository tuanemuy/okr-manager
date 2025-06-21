"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { createOkrAction } from "@/actions/okr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const keyResultSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
  targetValue: z
    .number()
    .min(0.01, "目標値は0より大きい値を入力してください")
    .max(999999, "目標値が大きすぎます"),
  unit: z.string().max(20, "単位は20文字以内で入力してください").optional(),
});

const createOkrFormSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  description: z
    .string()
    .max(1000, "説明は1000文字以内で入力してください")
    .optional(),
  type: z.enum(["team", "personal"], {
    message: "タイプを選択してください",
  }),
  year: z
    .number()
    .min(2020, "年は2020年以降を入力してください")
    .max(2050, "年は2050年以前を入力してください"),
  quarter: z.enum(["1", "2", "3", "4"], {
    message: "四半期を選択してください",
  }),
  keyResults: z
    .array(keyResultSchema)
    .min(1, "キーリザルトは最低1つ必要です")
    .max(5, "キーリザルトは最大5つまでです"),
});

type CreateOkrFormValues = z.infer<typeof createOkrFormSchema>;

interface CreateOkrFormProps {
  teamId: string;
}

export function CreateOkrForm({ teamId }: CreateOkrFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateOkrFormValues>({
    resolver: zodResolver(createOkrFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "personal",
      year: new Date().getFullYear(),
      quarter: String(Math.ceil((new Date().getMonth() + 1) / 3)) as
        | "1"
        | "2"
        | "3"
        | "4",
      keyResults: [
        {
          title: "",
          description: "",
          targetValue: 1,
          unit: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyResults",
  });

  const addKeyResult = () => {
    if (fields.length < 5) {
      append({
        title: "",
        description: "",
        targetValue: 1,
        unit: "",
      });
    } else {
      toast.error("キーリザルトは最大5つまでです");
    }
  };

  const removeKeyResult = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("キーリザルトは最低1つ必要です");
    }
  };

  const onSubmit = async (values: CreateOkrFormValues) => {
    startTransition(async () => {
      try {
        // Create FormData to match existing action signature
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("description", values.description || "");
        formData.append("type", values.type);
        formData.append("year", values.year.toString());
        formData.append("quarter", values.quarter);

        // Add key results as JSON
        values.keyResults.forEach((kr, index) => {
          formData.append(`keyResult-${index}-title`, kr.title);
          formData.append(
            `keyResult-${index}-description`,
            kr.description || "",
          );
          formData.append(
            `keyResult-${index}-targetValue`,
            kr.targetValue.toString(),
          );
          formData.append(`keyResult-${index}-unit`, kr.unit || "");
        });

        await createOkrAction(teamId, formData);
        toast.success("OKRを作成しました");
      } catch (error) {
        console.error("OKRの作成に失敗しました:", error);
        toast.error("OKRの作成に失敗しました");
      }
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/teams/${teamId}/okrs`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">新しいOKRを作成</h1>
            <p className="text-muted-foreground mt-2">
              目標と成果指標を設定してOKRを作成します
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイトル *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例: Q1 プロダクト開発目標"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイプ *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="タイプを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="team">チームOKR</SelectItem>
                          <SelectItem value="personal">個人OKR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="このOKRの目的や背景を説明してください"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      このOKRの目的や背景について詳しく説明してください（任意）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>年 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                  control={form.control}
                  name="quarter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>四半期 *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="四半期を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Q1 (1-3月)</SelectItem>
                          <SelectItem value="2">Q2 (4-6月)</SelectItem>
                          <SelectItem value="3">Q3 (7-9月)</SelectItem>
                          <SelectItem value="4">Q4 (10-12月)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                キーリザルト
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addKeyResult}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  追加
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">キーリザルト {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeKeyResult(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>タイトル *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例: 新機能を3つリリースする"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>説明</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="この成果指標の詳細を説明してください"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.targetValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>目標値 *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="100"
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
                        control={form.control}
                        name={`keyResults.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>単位</FormLabel>
                            <FormControl>
                              <Input placeholder="例: 個, %, 人" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-center">
                <Button type="button" variant="outline" onClick={addKeyResult}>
                  <Plus className="h-4 w-4 mr-2" />
                  キーリザルトを追加
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-4">
            <Link href={`/teams/${teamId}/okrs`}>
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? "作成中..." : "OKRを作成"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
