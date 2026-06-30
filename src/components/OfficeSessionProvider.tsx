"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { OfficeOption } from "@/lib/offices";
import { normalizeOfficeToken } from "@/lib/office-token-normalize";
import {
  clearOfficeSession,
  readOfficeSession,
  type OfficeSession,
  writeOfficeSession,
} from "@/lib/office-session";

type OfficeSessionContextValue = {
  session: OfficeSession | null;
  ready: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  activateToken: (token: string) => Promise<void>;
  signOut: () => void;
};

const OfficeSessionContext = createContext<OfficeSessionContextValue | null>(
  null
);

export function OfficeSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<OfficeSession | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setSession(readOfficeSession());
    setReady(true);
  }, []);

  const activateToken = useCallback(async (token: string) => {
    const trimmed = normalizeOfficeToken(token);
    if (!trimmed) {
      throw new Error("Please enter your office access token.");
    }

    const response = await fetch("/api/auth/office-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: trimmed }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ??
          "Invalid office access token. Ask your admin to sync office tokens to the database."
      );
    }

    const nextSession: OfficeSession = {
      office: data.office as OfficeOption,
      token: trimmed,
    };

    writeOfficeSession(nextSession);
    setSession(nextSession);
    setModalOpen(false);
  }, []);

  const signOut = useCallback(() => {
    clearOfficeSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      ready,
      modalOpen,
      openModal: () => setModalOpen(true),
      closeModal: () => setModalOpen(false),
      activateToken,
      signOut,
    }),
    [session, ready, modalOpen, activateToken, signOut]
  );

  return (
    <OfficeSessionContext.Provider value={value}>
      {children}
    </OfficeSessionContext.Provider>
  );
}

export function useOfficeSession() {
  const context = useContext(OfficeSessionContext);
  if (!context) {
    throw new Error("useOfficeSession must be used within OfficeSessionProvider");
  }
  return context;
}
