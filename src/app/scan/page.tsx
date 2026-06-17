import { PageShell } from "@/components/PageShell";
import { ScanQrCard } from "@/components/ScanQrCard";

export default function ScanPage() {
  return (
    <PageShell showBack={false}>
      <ScanQrCard />
    </PageShell>
  );
}
