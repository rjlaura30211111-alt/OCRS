import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { TrackReportsCard } from "@/components/TrackReportsCard";

export default function TrackPage() {
  return (
    <PageShell wide align="top">
      <Suspense fallback={null}>
        <TrackReportsCard />
      </Suspense>
    </PageShell>
  );
}
