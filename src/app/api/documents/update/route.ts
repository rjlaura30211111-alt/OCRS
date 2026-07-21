import { NextRequest, NextResponse } from "next/server";
import { isValidAction } from "@/lib/actions";
import {
  getDocumentByReference,
  toDocumentPayload,
  updateDocument,
} from "@/lib/documents";
import {
  canEditReportAtOffice,
  isOfficeAuthContext,
  requireOfficeAuth,
} from "@/lib/office-auth";
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
    const newReferenceNumber =
      typeof body.newReferenceNumber === "string"
        ? body.newReferenceNumber.trim()
        : "";
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const drafter =
      typeof body.drafter === "string" ? body.drafter.trim() : "";
    const actionRequested =
      typeof body.actionRequested === "string" ? body.actionRequested.trim() : "";

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required." },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    if (!drafter) {
      return NextResponse.json({ error: "Drafter is required." }, { status: 400 });
    }

    if (!isValidAction(actionRequested)) {
      return NextResponse.json(
        { error: "Invalid action requested." },
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

    const existing = await getDocumentByReference(referenceNumber);

    if (!existing) {
      return NextResponse.json({ error: "No Document Found" }, { status: 404 });
    }

    if (
      !canEditReportAtOffice(
        existing.currentOffice,
        auth.office,
        existing.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You can only edit reports while the document is pending at your office.",
        },
        { status: 403 }
      );
    }

    if (
      newReferenceNumber &&
      newReferenceNumber.toLowerCase() !== referenceNumber.toLowerCase()
    ) {
      const duplicate = await getDocumentByReference(newReferenceNumber);
      if (duplicate) {
        return NextResponse.json(
          { error: "Reference number already exists." },
          { status: 409 }
        );
      }
    }

    const document = await updateDocument({
      referenceNumber,
      newReferenceNumber: newReferenceNumber || undefined,
      subject,
      drafter,
      actionRequested,
    });

    return NextResponse.json({
      success: true,
      document: toDocumentPayload(document),
    });
  } catch (error) {
    console.error("document update error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update document.";
    const statusCode =
      message === "No Document Found"
        ? 404
        : /already exists/i.test(message)
          ? 409
          : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
