import { NextRequest, NextResponse } from "next/server";
import {
  isOfficeAuthContext,
  requireOfficeAuth,
} from "@/lib/office-auth";
import { listDocumentsByOffice, toDocumentPayload } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOfficeAuth(request);
    if (!isOfficeAuthContext(auth)) {
      return auth;
    }

    const requestedOffice =
      request.nextUrl.searchParams.get("office")?.trim() ?? "";

    if (requestedOffice && requestedOffice !== auth.office) {
      return NextResponse.json(
        { error: "You can only view the inbox for your office." },
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

    const documents = await listDocumentsByOffice(auth.office);

    return NextResponse.json({
      office: auth.office,
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
