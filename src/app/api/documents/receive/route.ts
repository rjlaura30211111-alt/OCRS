import { NextRequest, NextResponse } from "next/server";
import {
  canUseReceiveDisposition,
  isValidReceiveDisposition,
} from "@/lib/dispositions";
import {
  documentRequiresDestination,
  getWrongDestinationMessage,
} from "@/lib/document-destination";
import {
  isOfficeAuthContext,
  requireOfficeAuth,
} from "@/lib/office-auth";
import { isValidOfficeOption } from "@/lib/offices";
import {
  getDocumentByReference,
  getRoutingLogsByReference,
  hasOfficeReceivedDocument,
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
    const destinationOffice =
      typeof body.destinationOffice === "string"
        ? body.destinationOffice.trim()
        : "";

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

    if (!canUseReceiveDisposition(auth.office, status)) {
      return NextResponse.json(
        { error: "This disposition is only available to OCRS." },
        { status: 403 }
      );
    }

    if (!destinationOffice || !isValidOfficeOption(destinationOffice)) {
      return NextResponse.json(
        { error: "Office Destination is required." },
        { status: 400 }
      );
    }

    if (auth.office !== destinationOffice) {
      return NextResponse.json(
        {
          error: getWrongDestinationMessage(destinationOffice),
          code: "WRONG_DESTINATION_OFFICE",
        },
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

    const existing = await getDocumentByReference(referenceNumber);

    if (!existing) {
      return NextResponse.json(
        { error: "No Document Found" },
        { status: 404 }
      );
    }

    if (
      documentRequiresDestination(existing.destinationOffice) &&
      existing.destinationOffice !== destinationOffice
    ) {
      return NextResponse.json(
        {
          error: getWrongDestinationMessage(existing.destinationOffice!),
          code: "WRONG_DESTINATION_OFFICE",
        },
        { status: 403 }
      );
    }

    if (
      existing.currentOffice?.trim() === auth.office &&
      (await hasOfficeReceivedDocument(referenceNumber, auth.office))
    ) {
      return NextResponse.json(
        {
          error: `This document is already on-hand at ${auth.office}. Check your Office Inbox instead of scanning again.`,
          code: "DOCUMENT_ON_HAND",
        },
        { status: 409 }
      );
    }

    const document = await receiveDocument({
      referenceNumber,
      receivedBy,
      status,
      currentOffice: auth.office,
      destinationOffice,
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
