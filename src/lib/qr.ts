import QRCode from "qrcode";
import {
  QR_GENERATION_PX,
  QR_PREVIEW_PX,
} from "@/lib/qr-config";

export async function generateQrPng(referenceNumber: string): Promise<Buffer> {
  return QRCode.toBuffer(referenceNumber.trim(), {
    type: "png",
    width: QR_GENERATION_PX,
    margin: 1,
    errorCorrectionLevel: "H",
  });
}

export async function generateQrDataUrl(referenceNumber: string): Promise<string> {
  return QRCode.toDataURL(referenceNumber.trim(), {
    width: QR_PREVIEW_PX,
    margin: 1,
    errorCorrectionLevel: "H",
  });
}
