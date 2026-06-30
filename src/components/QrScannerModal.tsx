"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type QrScannerModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onScan: (value: string) => void;
};

export function QrScannerModal({
  open,
  title = "Scan QR Code",
  onClose,
  onScan,
}: QrScannerModalProps) {
  const scannerId = useId().replace(/:/g, "");
  const readerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    const reader = new Html5Qrcode(`qr-reader-${scannerId}`);
    readerRef.current = reader;
    setError(null);

    reader
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onScanRef.current(decodedText.trim());
          onCloseRef.current();
        },
        () => {}
      )
      .catch(() => {
        if (active) {
          setError("Could not access camera. Check browser permissions.");
        }
      });

    return () => {
      active = false;
      const instance = readerRef.current;
      readerRef.current = null;
      if (instance?.isScanning) {
        void instance.stop().then(() => instance.clear());
      } else {
        instance?.clear();
      }
    };
  }, [open, scannerId]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div
          id={`qr-reader-${scannerId}`}
          className="overflow-hidden rounded-xl bg-black"
        />
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
