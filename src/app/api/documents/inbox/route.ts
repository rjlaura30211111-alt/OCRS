import { NextRequest, NextResponse } from "next/server";
import { isValidOfficeOption } from "@/lib/offices";
import { listDocumentsByOffice, toDocumentPayload } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const office = request.nextUrl.searchParams.get("office")?.trim() ?? "";

    if (!office) {
      return NextResponse.json(
        { error: "Office is required." },
        { status: 400 }
      );
    }

    if (!isValidOfficeOption(office)) {
      return NextResponse.json({ error: "Invalid office." }, { status: 400 });
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

    const documents = await listDocumentsByOffice(office);

    return NextResponse.json({
      office,
      count: documents.length,
      results: documents.map(toDocumentPayload),
    });
  } catch (error) {
    console.error("document inbox error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load inbox.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
