import { PageShell } from "@/components/PageShell";
import { TrackDocumentCard } from "@/components/TrackDocumentCard";

export default function TrackPage() {
  return (
    <PageShell showBack={false}>
      <TrackDocumentCard />
    </PageShell>
  );
}
