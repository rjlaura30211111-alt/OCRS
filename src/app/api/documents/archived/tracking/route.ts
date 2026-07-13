import { NextRequest, NextResponse } from "next/server";
import {
  getArchivedDocumentByReference,
  getArchivedRoutingLogsByReference,
  toRoutingLogPayload,
} from "@/lib/documents";
import {
  isOfficeAuthContext,
  requireOfficeAuth,
  requireOcrsOffice,
} from "@/lib/office-auth";
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

    const auth = await requireOfficeAuth(request);
    if (!isOfficeAuthContext(auth)) {
      return auth;
    }

    const denied = requireOcrsOffice(auth);
    if (denied) {
      return denied;
    }

    const document = await getArchivedDocumentByReference(referenceNumber);

    if (!document) {
      return NextResponse.json(
        { found: false, message: "No archived document found." },
        { status: 404 }
      );
    }

    const tracking = await getArchivedRoutingLogsByReference(referenceNumber);
    const submitLog = tracking.find((entry) => entry.notes === "Document submitted");

    return NextResponse.json({
      found: true,
      referenceNumber,
      archived: {
        archivedAt: document.archivedAt,
        archivedByOffice: document.archivedByOffice,
      },
      document: {
        referenceNumber: document.referenceNumber,
        subject: document.subject,
        drafter: document.drafter,
        sentDate: document.sentDate,
        sentTime: document.sentTime,
        submitOffice: submitLog?.officeCode ?? document.currentOffice ?? "OCRS",
        submitLoggedAt: submitLog?.loggedAt ?? document.documentCreatedAt,
        destinationOffice: document.destinationOffice,
      },
      tracking: tracking.map(toRoutingLogPayload),
    });
  } catch (error) {
    console.error("archived document tracking error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load archived tracking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
