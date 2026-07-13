import { NextRequest, NextResponse } from "next/server";
import {
  archiveDocumentByReference,
  getDocumentByReference,
  getDocumentSubmitOffice,
} from "@/lib/documents";
import {
  isOfficeAuthContext,
  requireOfficeAuth,
} from "@/lib/office-auth";
import { matchesOfficeReportScope } from "@/lib/report-scope";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
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

    const body = (await request.json()) as { referenceNumber?: string };
    const referenceNumber = body.referenceNumber?.trim();

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required." },
        { status: 400 }
      );
    }

    const document = await getDocumentByReference(referenceNumber);

    if (!document) {
      return NextResponse.json({ error: "No Document Found" }, { status: 404 });
    }

    const submitOffice = await getDocumentSubmitOffice(
      document.id,
      document.currentOffice
    );

    if (
      !matchesOfficeReportScope({
        viewerOffice: auth.office,
        submitOffice,
        currentOffice: document.currentOffice,
      })
    ) {
      return NextResponse.json(
        { error: "You cannot delete this document." },
        { status: 403 }
      );
    }

    await archiveDocumentByReference(referenceNumber, auth.office);

    return NextResponse.json({ ok: true, referenceNumber });
  } catch (error) {
    console.error("document archive error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to archive document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
