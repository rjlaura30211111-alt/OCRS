import { NextRequest, NextResponse } from "next/server";
import { exportDatabaseBackup } from "@/lib/database-backup";
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

    const backup = await exportDatabaseBackup();
    const filename = `ocrs-backup-${backup.exportedAt.slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("backup export error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to export backup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
