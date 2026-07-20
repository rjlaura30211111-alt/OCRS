import { NextRequest, NextResponse } from "next/server";
import { approveDeletionRequest } from "@/lib/deletion-requests";
import {
  isOfficeAuthContext,
  requireOcrsOffice,
  requireOfficeAuth,
} from "@/lib/office-auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as {
      requestId?: string;
      deletedBy?: string;
    };

    const requestId = body.requestId?.trim();
    const deletedBy = body.deletedBy?.trim() ?? "";

    if (!requestId) {
      return NextResponse.json(
        { error: "Deletion request id is required." },
        { status: 400 }
      );
    }

    if (!deletedBy) {
      return NextResponse.json(
        { error: "Deleted by is required." },
        { status: 400 }
      );
    }

    await approveDeletionRequest(requestId, deletedBy, auth.office);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("deletion request approve error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to approve deletion.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
