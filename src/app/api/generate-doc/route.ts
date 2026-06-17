import { NextRequest, NextResponse } from "next/server";
import { isValidAction } from "@/lib/actions";
import { fillWordTemplate } from "@/lib/doc-template";
import { canAutoOpenWord, saveAndOpenWord } from "@/lib/open-doc";
import { generateQrPng } from "@/lib/qr";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const referenceNumber =
      typeof body.referenceNumber === "string"
        ? body.referenceNumber.trim()
        : "";
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const time = typeof body.time === "string" ? body.time.trim() : "";
    const actionRequested =
      typeof body.actionRequested === "string" ? body.actionRequested.trim() : "";
    const openWord = body.openWord !== false;

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required." },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }

    if (!time) {
      return NextResponse.json({ error: "Time is required." }, { status: 400 });
    }

    if (!isValidAction(actionRequested)) {
      return NextResponse.json(
        { error: "Invalid action requested." },
        { status: 400 }
      );
    }

    const qrPng = await generateQrPng(referenceNumber);
    const docBuffer = await fillWordTemplate({
      subject,
      referenceNumber,
      date,
      time,
      actionRequested,
      qrPng,
    });

    const safeName = referenceNumber.replace(/[^\w\-]/g, "_").slice(0, 50);
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
    console.error("generate-doc error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
