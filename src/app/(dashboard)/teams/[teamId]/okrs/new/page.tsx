import { CreateOkrForm } from "@/components/okr/CreateOkrForm";

export default function NewOkrPage({
  params,
}: {
  params: { teamId: string };
}) {
  return <CreateOkrForm teamId={params.teamId} />;
}
