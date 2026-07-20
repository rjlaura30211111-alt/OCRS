import { NextRequest, NextResponse } from "next/server";
import { createDeletionRequest } from "@/lib/deletion-requests";
import {
  getDocumentByReference,
  getDocumentSubmitOffice,
} from "@/lib/documents";
import {
  isOfficeAuthContext,
  requireOfficeAuth,
} from "@/lib/office-auth";
import { isOcrsOffice } from "@/lib/office-permissions";
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

    if (isOcrsOffice(auth.office)) {
      return NextResponse.json(
        { error: "OCRS approves deletion requests from the Request for Deletion page." },
        { status: 403 }
      );
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

    if (submitOffice.trim() !== auth.office.trim()) {
      return NextResponse.json(
        { error: "You can only request deletion for reports submitted by your office." },
        { status: 403 }
      );
    }

    const created = await createDeletionRequest(referenceNumber, auth.office);

    return NextResponse.json({
      ok: true,
      referenceNumber: created.referenceNumber,
      message: "Deletion request sent to OCRS for approval.",
    });
  } catch (error) {
    console.error("deletion request create error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit deletion request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
