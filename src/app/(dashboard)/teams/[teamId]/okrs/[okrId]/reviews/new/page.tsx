import { notFound } from "next/navigation";
import { getOkrAction } from "@/actions/okr";
import { CreateReviewForm } from "@/components/okr/CreateReviewForm";

export default async function NewReviewPage({
  params,
}: {
  params: { teamId: string; okrId: string };
}) {
  const okrData = await getOkrAction(params.okrId);

  if (!okrData.okr) {
    notFound();
  }

  return (
    <CreateReviewForm
      teamId={params.teamId}
      okrId={params.okrId}
      okrTitle={okrData.okr.title}
    />
  );
}
