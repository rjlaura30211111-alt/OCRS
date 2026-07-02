"use client";

import { OfficeAccessHeader } from "@/components/OfficeAccessHeader";
import { OfficeAccessModal } from "@/components/OfficeAccessModal";
import { OfficeSessionProvider } from "@/components/OfficeSessionProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <OfficeSessionProvider>
      <div className="flex min-h-screen flex-col">
        <OfficeAccessHeader />
        <div className="flex-1">{children}</div>
      </div>
      <OfficeAccessModal />
    </OfficeSessionProvider>
  );
}
