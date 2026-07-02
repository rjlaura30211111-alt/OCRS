import { ImageResponse } from "next/og";
import { PwaIconMark } from "@/lib/pwa-icon";

export const runtime = "edge";

const ALLOWED_SIZES = new Set([192, 512]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await context.params;
  const parsed = Number.parseInt(sizeParam, 10);
  const size = ALLOWED_SIZES.has(parsed) ? parsed : 192;

  return new ImageResponse(<PwaIconMark />, {
    width: size,
    height: size,
  });
}
