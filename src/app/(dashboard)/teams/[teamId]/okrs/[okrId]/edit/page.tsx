import { getOkrAction } from "@/actions/okr";
import { OkrEditForm } from "@/components/okr/okr-edit-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditOkrPage({
  params,
}: {
  params: { teamId: string; okrId: string };
}) {
  try {
    const { okr, keyResults } = await getOkrAction(params.okrId);

    // Verify the OKR belongs to the correct team
    if (okr.teamId !== params.teamId) {
      notFound();
    }

    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href={`/teams/${params.teamId}/okrs/${params.okrId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              OKR詳細に戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">OKRを編集</h1>
          <p className="text-muted-foreground">
            OKRのタイトルと説明、Key Resultsを編集できます。
          </p>
        </div>

        <OkrEditForm teamId={params.teamId} okr={okr} keyResults={keyResults} />
      </div>
    );
  } catch (error) {
    console.error("Error loading OKR:", error);
    notFound();
  }
}
