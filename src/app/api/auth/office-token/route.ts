import { NextRequest, NextResponse } from "next/server";
import { resolveOfficeByToken } from "@/lib/office-auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "Office access token is required." },
        { status: 400 }
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

    const office = await resolveOfficeByToken(token);

    if (!office) {
      return NextResponse.json(
        { error: "Invalid office access token." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      office,
    });
  } catch (error) {
    console.error("office token auth error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to verify token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
