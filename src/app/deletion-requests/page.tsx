import { PageShell } from "@/components/PageShell";
import { DeletionRequestsCard } from "@/components/DeletionRequestsCard";

export default function DeletionRequestsPage() {
  return (
    <PageShell wide align="top">
      <DeletionRequestsCard />
    </PageShell>
  );
}
