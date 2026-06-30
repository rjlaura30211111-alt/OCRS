import { NextRequest, NextResponse } from "next/server";
import { isValidReceiveDisposition } from "@/lib/dispositions";
import {
  isOfficeAuthContext,
  requireOfficeAuth,
} from "@/lib/office-auth";
import {
  getDocumentByReference,
  getRoutingLogsByReference,
  receiveDocument,
  toDocumentPayload,
  toRoutingLogPayload,
} from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOfficeAuth(request);
    if (!isOfficeAuthContext(auth)) {
      return auth;
    }

    const body = await request.json();
    const referenceNumber =
      typeof body.referenceNumber === "string"
        ? body.referenceNumber.trim()
        : "";
    const receivedBy =
      typeof body.receivedBy === "string" ? body.receivedBy.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required." },
        { status: 400 }
      );
    }

    if (!receivedBy) {
      return NextResponse.json(
        { error: "Received by is required." },
        { status: 400 }
      );
    }

    if (!isValidReceiveDisposition(status)) {
      return NextResponse.json(
        { error: "Invalid disposition." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Set Supabase environment variables.",
        },
        { status: 503 }
      );
    }

    const document = await receiveDocument({
      referenceNumber,
      receivedBy,
      status,
      currentOffice: auth.office,
    });

    const tracking = await getRoutingLogsByReference(referenceNumber);

    return NextResponse.json({
      success: true,
      document: toDocumentPayload(document),
      tracking: tracking.map(toRoutingLogPayload),
    });
  } catch (error) {
    console.error("document receive error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to record receipt.";
    const statusCode = message === "No Document Found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
