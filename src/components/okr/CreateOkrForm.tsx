"use client";

import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addKeyResultAction, createOkrAction } from "@/actions/okr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface KeyResult {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
}

interface CreateOkrFormProps {
  teamId: string;
}

export function CreateOkrForm({ teamId }: CreateOkrFormProps) {
  const [keyResults, setKeyResults] = useState<KeyResult[]>([
    { id: "1", title: "", description: "", targetValue: 0, unit: "" },
  ]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const addKeyResult = () => {
    const newId = String(keyResults.length + 1);
    setKeyResults([
      ...keyResults,
      { id: newId, title: "", description: "", targetValue: 0, unit: "" },
    ]);
  };

  const removeKeyResult = (id: string) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((kr) => kr.id !== id));
    }
  };

  const updateKeyResult = (
    id: string,
    field: keyof KeyResult,
    value: string | number,
  ) => {
    setKeyResults(
      keyResults.map((kr) => (kr.id === id ? { ...kr, [field]: value } : kr)),
    );
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        // First create the OKR
        await createOkrAction(teamId, formData);

        // The createOkrAction will redirect to the OKR detail page
        // where we can add key results
      } catch (error) {
        console.error("Failed to create OKR:", error);
        alert("OKRの作成に失敗しました");
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

      <form action={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="例: Q1 プロダクト開発目標"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">タイプ *</Label>
                <Select name="type" defaultValue="personal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">チームOKR</SelectItem>
                    <SelectItem value="personal">個人OKR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="このOKRの目的や背景を説明してください"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">年 *</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quarter">四半期 *</Label>
                <Select
                  name="quarter"
                  defaultValue={String(
                    Math.ceil((new Date().getMonth() + 1) / 3),
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1 (1-3月)</SelectItem>
                    <SelectItem value="2">Q2 (4-6月)</SelectItem>
                    <SelectItem value="3">Q3 (7-9月)</SelectItem>
                    <SelectItem value="4">Q4 (10-12月)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Key Results
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
            {keyResults.map((keyResult, index) => (
              <div key={keyResult.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Key Result {index + 1}</h4>
                  {keyResults.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeKeyResult(keyResult.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`kr${keyResult.id}-title`}>
                      タイトル *
                    </Label>
                    <Input
                      id={`kr${keyResult.id}-title`}
                      name={`keyResult-${keyResult.id}-title`}
                      placeholder="例: 新機能を3つリリースする"
                      value={keyResult.title}
                      onChange={(e) =>
                        updateKeyResult(keyResult.id, "title", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`kr${keyResult.id}-description`}>
                      説明
                    </Label>
                    <Textarea
                      id={`kr${keyResult.id}-description`}
                      name={`keyResult-${keyResult.id}-description`}
                      placeholder="この成果指標の詳細を説明してください"
                      value={keyResult.description}
                      onChange={(e) =>
                        updateKeyResult(
                          keyResult.id,
                          "description",
                          e.target.value,
                        )
                      }
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`kr${keyResult.id}-target`}>
                        目標値 *
                      </Label>
                      <Input
                        id={`kr${keyResult.id}-target`}
                        name={`keyResult-${keyResult.id}-targetValue`}
                        type="number"
                        placeholder="100"
                        value={keyResult.targetValue || ""}
                        onChange={(e) =>
                          updateKeyResult(
                            keyResult.id,
                            "targetValue",
                            Number(e.target.value),
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`kr${keyResult.id}-unit`}>単位</Label>
                      <Input
                        id={`kr${keyResult.id}-unit`}
                        name={`keyResult-${keyResult.id}-unit`}
                        placeholder="例: 個, %, 人"
                        value={keyResult.unit}
                        onChange={(e) =>
                          updateKeyResult(keyResult.id, "unit", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center">
              <Button type="button" variant="outline" onClick={addKeyResult}>
                <Plus className="h-4 w-4 mr-2" />
                Key Result を追加
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
    </div>
  );
}
