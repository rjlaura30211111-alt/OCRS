import { NextRequest, NextResponse } from "next/server";
import { listArchivedDocuments, toArchivedReportPayload } from "@/lib/documents";
import {
  isOfficeAuthContext,
  requireOfficeAuth,
  requireOcrsOffice,
} from "@/lib/office-auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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

    const denied = requireOcrsOffice(auth);
    if (denied) {
      return denied;
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam) || 500, 500) : 500;
    const documents = await listArchivedDocuments(limit);

    return NextResponse.json({
      count: documents.length,
      results: documents.map(toArchivedReportPayload),
    });
  } catch (error) {
    console.error("archived documents list error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load archived reports.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
