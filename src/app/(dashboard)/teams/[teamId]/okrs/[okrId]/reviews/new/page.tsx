import { notFound } from "next/navigation";
import { getOkrAction } from "@/actions/okr";
import { CreateReviewForm } from "@/components/okr/CreateReviewForm";

export default async function NewReviewPage({
  params,
}: {
  params: Promise<{ teamId: string; okrId: string }>;
}) {
  const { teamId, okrId } = await params;
  const okrData = await getOkrAction(okrId);

  if (!okrData.okr) {
    notFound();
  }

  return (
    <CreateReviewForm
      teamId={teamId}
      okrId={okrId}
      okrTitle={okrData.okr.title}
    />
  );
}
