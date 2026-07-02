import type { ReactNode } from "react";

export function PwaIconMark({ label = "OCRS" }: { label?: string }): ReactNode {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a3f6f 0%, #2563eb 100%)",
        color: "white",
        fontSize: 56,
        fontWeight: 700,
        letterSpacing: -1,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {label}
    </div>
  );
}
