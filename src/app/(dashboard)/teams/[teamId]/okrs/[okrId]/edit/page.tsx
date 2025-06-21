import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getOkrAction } from "@/actions/okr";
import { OkrEditForm } from "@/components/okr/okr-edit-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function EditOkrSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OKR基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            キーリザルト
            <Skeleton className="h-10 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-8 w-8 ml-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

async function EditOkrContent({
  teamId,
  okrId,
}: {
  teamId: string;
  okrId: string;
}) {
  try {
    const { okr, keyResults } = await getOkrAction(okrId);

    // Verify the OKR belongs to the correct team
    if (okr.teamId !== teamId) {
      notFound();
    }

    return <OkrEditForm teamId={teamId} okr={okr} keyResults={keyResults} />;
  } catch (error) {
    console.error("Error loading OKR:", error);
    notFound();
  }
}

export default async function EditOkrPage({
  params,
}: {
  params: Promise<{ teamId: string; okrId: string }>;
}) {
  const { teamId, okrId } = await params;

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href={`/teams/${teamId}/okrs/${okrId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            OKR詳細に戻る
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">OKRを編集</h1>
        <p className="text-muted-foreground">
          OKRのタイトルと説明、キーリザルトを編集できます。
        </p>
      </div>

      <Suspense fallback={<EditOkrSkeleton />}>
        <EditOkrContent teamId={teamId} okrId={okrId} />
      </Suspense>
    </div>
  );
}
