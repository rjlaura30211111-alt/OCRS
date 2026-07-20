import { NextRequest, NextResponse } from "next/server";
import {
  listPendingDeletionRequests,
  toDeletionRequestPayload,
} from "@/lib/deletion-requests";
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

    const requests = await listPendingDeletionRequests();

    return NextResponse.json({
      count: requests.length,
      results: requests.map(toDeletionRequestPayload),
    });
  } catch (error) {
    console.error("deletion requests list error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load deletion requests.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
