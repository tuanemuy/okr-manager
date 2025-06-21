import Link from "next/link";
import { getOkrsAction } from "@/actions/okr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamRecentOkrsProps {
  teamId: string;
}

export default async function TeamRecentOkrs({ teamId }: TeamRecentOkrsProps) {
  const okrsResult = await getOkrsAction(teamId);
  const okrs = Array.isArray(okrsResult) ? okrsResult : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          最近のOKR
          <Button size="sm" asChild>
            <Link href={`/teams/${teamId}/okrs`}>すべて見る</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {okrs.slice(0, 3).map((okr) => {
            // Calculate progress from key results
            const totalKeyResults = okr.keyResults?.length || 0;
            const progress =
              totalKeyResults > 0
                ? (okr.keyResults.reduce(
                    (sum: number, kr) => sum + kr.currentValue / kr.targetValue,
                    0,
                  ) /
                    totalKeyResults) *
                  100
                : 0;

            return (
              <div key={okr.id} className="p-3 border rounded-lg">
                <h4 className="font-medium">{okr.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {okr.description || "説明なし"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline">
                    Q{okr.quarterQuarter} {okr.quarterYear}
                  </Badge>
                  <span className="text-sm font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            );
          })}
          {okrs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              OKRがありません
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
