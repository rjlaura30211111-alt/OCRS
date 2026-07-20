import { NextRequest, NextResponse } from "next/server";
import { collectStatistics } from "@/lib/statistics";
import {
  isOfficeAuthContext,
  requireOcrsOffice,
  requireOfficeAuth,
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

    const ocrsError = requireOcrsOffice(auth);
    if (ocrsError) {
      return ocrsError;
    }

    const statistics = await collectStatistics();
    return NextResponse.json(statistics);
  } catch (error) {
    console.error("statistics error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load statistics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
