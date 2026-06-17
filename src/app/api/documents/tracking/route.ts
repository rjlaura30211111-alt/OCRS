import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentByReference,
  getRoutingLogsByReference,
  toRoutingLogPayload,
} from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const referenceNumber =
      request.nextUrl.searchParams.get("ref")?.trim() ?? "";

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required." },
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

    const document = await getDocumentByReference(referenceNumber);

    if (!document) {
      return NextResponse.json(
        { found: false, message: "No Document Found" },
        { status: 404 }
      );
    }

    const tracking = await getRoutingLogsByReference(referenceNumber);
    const submitLog = tracking.find((entry) => entry.notes === "Document submitted");

    return NextResponse.json({
      found: true,
      referenceNumber,
      document: {
        referenceNumber: document.referenceNumber,
        subject: document.subject,
        drafter: document.drafter,
        sentDate: document.sentDate,
        sentTime: document.sentTime,
        submitOffice: submitLog?.officeCode ?? document.currentOffice ?? "OCRS",
        submitLoggedAt: submitLog?.loggedAt ?? document.createdAt,
      },
      tracking: tracking.map(toRoutingLogPayload),
    });
  } catch (error) {
    console.error("document tracking error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load tracking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
