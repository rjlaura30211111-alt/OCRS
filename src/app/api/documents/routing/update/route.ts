import { NextRequest, NextResponse } from "next/server";
import {
  canUseReceiveDisposition,
  isValidReceiveDisposition,
} from "@/lib/dispositions";
import {
  canEditTrackingAtOffice,
  isOfficeAuthContext,
  requireOfficeAuth,
} from "@/lib/office-auth";
import {
  getDocumentByReference,
  toDocumentPayload,
  toRoutingLogPayload,
  updateRoutingLog,
} from "@/lib/documents";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOfficeAuth(request);
    if (!isOfficeAuthContext(auth)) {
      return auth;
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const referenceNumber =
      typeof body.referenceNumber === "string"
        ? body.referenceNumber.trim()
        : "";
    const receivedBy =
      typeof body.receivedBy === "string" ? body.receivedBy.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!id || !referenceNumber) {
      return NextResponse.json(
        { error: "Tracking entry id and reference number are required." },
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

    if (!canUseReceiveDisposition(auth.office, status)) {
      return NextResponse.json(
        { error: "This disposition is only available to OCRS." },
        { status: 403 }
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
        { error: "No Document Found" },
        { status: 404 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: logRow, error: fetchError } = await supabase
      .from("document_routing_logs")
      .select("office_code")
      .eq("id", id)
      .eq("document_id", document.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!logRow) {
      return NextResponse.json(
        { error: "Tracking entry not found." },
        { status: 404 }
      );
    }

    if (
      !canEditTrackingAtOffice(
        document.currentOffice,
        logRow.office_code,
        auth.office
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You can only edit tracking for documents currently at your office.",
        },
        { status: 403 }
      );
    }

    const result = await updateRoutingLog({
      id,
      referenceNumber,
      officeCode: auth.office,
      receivedBy,
      status,
    });

    return NextResponse.json({
      success: true,
      document: toDocumentPayload(result.document),
      tracking: result.logs.map(toRoutingLogPayload),
    });
  } catch (error) {
    console.error("routing update error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update tracking.";
    const statusCode =
      message === "No Document Found" || message === "Tracking entry not found."
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
