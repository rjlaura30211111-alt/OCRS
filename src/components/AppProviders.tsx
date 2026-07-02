"use client";

import { OfficeAccessHeader } from "@/components/OfficeAccessHeader";
import { OfficeAccessModal } from "@/components/OfficeAccessModal";
import { OfficeSessionProvider } from "@/components/OfficeSessionProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <OfficeSessionProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
        <OfficeAccessHeader />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
      <OfficeAccessModal />
    </OfficeSessionProvider>
  );
}
