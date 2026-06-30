import { NextRequest, NextResponse } from "next/server";
import { listDocumentReports, toReportPayload } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam) || 100, 200) : 100;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Set Supabase environment variables.",
        },
        { status: 503 }
      );
    }

    const documents = await listDocumentReports(limit);

    return NextResponse.json({
      count: documents.length,
      results: documents.map(toReportPayload),
    });
  } catch (error) {
    console.error("document reports error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load reports.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
