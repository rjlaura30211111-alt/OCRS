import { NextRequest, NextResponse } from "next/server";
import type { ActionRequested } from "@/lib/actions";
import { getDocumentByReference } from "@/lib/documents";
import { fillWordTemplate } from "@/lib/doc-template";
import { canAutoOpenWord, saveAndOpenWord } from "@/lib/open-doc";
import {
  canEditReportAtOffice,
  isOfficeAuthContext,
  requireOfficeAuth,
} from "@/lib/office-auth";
import { generateQrPng } from "@/lib/qr";
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
    const openWord = body.openWord !== false;

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
      return NextResponse.json({ error: "No Document Found" }, { status: 404 });
    }

    if (
      !canEditReportAtOffice(
        document.currentOffice,
        auth.office,
        document.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You can only print reports while the document is pending at your office.",
        },
        { status: 403 }
      );
    }

    const qrPng = await generateQrPng(document.referenceNumber);
    const docBuffer = await fillWordTemplate({
      subject: document.subject,
      referenceNumber: document.referenceNumber,
      drafter: document.drafter,
      actionRequested: document.actionRequested as ActionRequested,
      qrPng,
    });

    const safeName = document.referenceNumber
      .replace(/[^\w\-]/g, "_")
      .slice(0, 50);
    const filename = `reference-${safeName}.docx`;

    if (openWord && canAutoOpenWord()) {
      try {
        await saveAndOpenWord(docBuffer, filename);
      } catch (openError) {
        console.error("open-word error:", openError);
      }
    }

    return new NextResponse(new Uint8Array(docBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Word-Opened": openWord && canAutoOpenWord() ? "1" : "0",
      },
    });
  } catch (error) {
    console.error("document reprint error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to print report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
