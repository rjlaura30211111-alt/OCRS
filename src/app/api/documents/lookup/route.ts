import { NextRequest, NextResponse } from "next/server";
import { getDisplayStatus, getDocumentByReference } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const referenceNumber =
      typeof body.referenceNumber === "string"
        ? body.referenceNumber.trim()
        : "";

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

    return NextResponse.json({
      found: true,
      document: {
        referenceNumber: document.referenceNumber,
        subject: document.subject,
        drafter: document.drafter,
        actionRequested: document.actionRequested,
        receivedBy: document.receivedBy,
        status: getDisplayStatus(document.status),
        rawStatus: document.status,
        timestamp: document.updatedAt,
        currentOffice: document.currentOffice,
      },
    });
  } catch (error) {
    console.error("document lookup error:", error);
    const message =
      error instanceof Error ? error.message : "Lookup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
