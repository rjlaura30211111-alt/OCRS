import { NextRequest, NextResponse } from "next/server";
import { isValidReceiveDisposition } from "@/lib/dispositions";
import { isValidOfficeOption } from "@/lib/offices";
import {
  toDocumentPayload,
  toRoutingLogPayload,
  updateRoutingLog,
} from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const referenceNumber =
      typeof body.referenceNumber === "string"
        ? body.referenceNumber.trim()
        : "";
    const officeCode =
      typeof body.officeCode === "string" ? body.officeCode.trim() : "";
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

    if (!isValidOfficeOption(officeCode)) {
      return NextResponse.json(
        { error: "Office is required." },
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

    const result = await updateRoutingLog({
      id,
      referenceNumber,
      officeCode,
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
