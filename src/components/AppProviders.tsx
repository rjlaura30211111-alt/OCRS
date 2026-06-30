"use client";

import { OfficeAccessModal } from "@/components/OfficeAccessModal";
import { OfficeSessionProvider } from "@/components/OfficeSessionProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <OfficeSessionProvider>
      {children}
      <OfficeAccessModal />
    </OfficeSessionProvider>
  );
}
