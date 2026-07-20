import { PageShell } from "@/components/PageShell";
import { ReceivedDocumentCard } from "@/components/ReceivedDocumentCard";

export default function ScanPage() {
  return (
    <PageShell wide align="top">
      <ReceivedDocumentCard />
    </PageShell>
  );
}
