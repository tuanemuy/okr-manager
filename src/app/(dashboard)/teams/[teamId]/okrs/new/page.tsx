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
import { Plus, X } from "lucide-react";

export default function NewOkrPage({
  params,
}: {
  params: { teamId: string };
}) {
  // TODO: Implement form handling with server actions

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">新しいOKRを作成</h1>
        <p className="text-muted-foreground mt-2">
          目標と成果指標を設定してOKRを作成します
        </p>
      </div>

      <form className="space-y-8">
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
                  placeholder="例: Q1 プロダクト開発"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">タイプ *</Label>
                <Select defaultValue="personal">
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
                placeholder="このOKRの目的や背景を説明してください"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日 *</Label>
                <Input id="startDate" type="date" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">終了日 *</Label>
                <Input id="endDate" type="date" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Key Results
              <Button type="button" size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Result 1 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Key Result 1</h4>
                <Button type="button" size="sm" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kr1-title">タイトル *</Label>
                  <Input
                    id="kr1-title"
                    placeholder="例: 新機能を3つリリースする"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kr1-description">説明</Label>
                  <Textarea
                    id="kr1-description"
                    placeholder="この成果指標の詳細を説明してください"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kr1-current">現在値</Label>
                    <Input
                      id="kr1-current"
                      type="number"
                      placeholder="0"
                      defaultValue="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kr1-target">目標値 *</Label>
                    <Input
                      id="kr1-target"
                      type="number"
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kr1-unit">単位</Label>
                    <Input id="kr1-unit" placeholder="例: 個, %, 人" />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Result 2 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Key Result 2</h4>
                <Button type="button" size="sm" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kr2-title">タイトル *</Label>
                  <Input
                    id="kr2-title"
                    placeholder="例: バグ数を50%削減する"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kr2-description">説明</Label>
                  <Textarea
                    id="kr2-description"
                    placeholder="この成果指標の詳細を説明してください"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kr2-current">現在値</Label>
                    <Input
                      id="kr2-current"
                      type="number"
                      placeholder="0"
                      defaultValue="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kr2-target">目標値 *</Label>
                    <Input
                      id="kr2-target"
                      type="number"
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kr2-unit">単位</Label>
                    <Input id="kr2-unit" placeholder="例: 個, %, 人" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button type="button" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Key Result を追加
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            キャンセル
          </Button>
          <Button type="submit">OKRを作成</Button>
        </div>
      </form>
    </div>
  );
}
