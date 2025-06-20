import { CreateOkrForm } from "@/components/okr/CreateOkrForm";

export default async function NewOkrPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <CreateOkrForm teamId={teamId} />;
}
