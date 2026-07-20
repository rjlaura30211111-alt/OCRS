import { PageShell } from "@/components/PageShell";
import { SubmitReportCard } from "@/components/SubmitReportCard";

export default function SubmitPage() {
  return (
    <PageShell full={false} align="top">
      <SubmitReportCard />
    </PageShell>
  );
}
