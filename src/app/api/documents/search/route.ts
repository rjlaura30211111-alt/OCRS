import { NextRequest, NextResponse } from "next/server";
import { searchDocumentsByReference, toDocumentPayload } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return NextResponse.json({ results: [] });
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

    const documents = await searchDocumentsByReference(query);

    return NextResponse.json({
      results: documents.map(toDocumentPayload),
    });
  } catch (error) {
    console.error("document search error:", error);
    const message =
      error instanceof Error ? error.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
