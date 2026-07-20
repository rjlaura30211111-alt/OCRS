import { NextRequest, NextResponse } from "next/server";
import { restoreDatabaseBackup } from "@/lib/database-backup";
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
      backup?: unknown;
      confirm?: string;
    };

    if (body.confirm?.trim() !== "RESTORE") {
      return NextResponse.json(
        { error: 'Type RESTORE in the confirmation field to proceed.' },
        { status: 400 }
      );
    }

    const result = await restoreDatabaseBackup(body.backup);
    return NextResponse.json({ ok: true, restored: result.restored });
  } catch (error) {
    console.error("backup restore error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to restore backup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
