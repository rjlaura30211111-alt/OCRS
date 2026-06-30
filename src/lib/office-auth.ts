import { NextRequest, NextResponse } from "next/server";
import { isValidOfficeOption, type OfficeOption } from "@/lib/offices";
import { canEditTrackingAtOffice } from "@/lib/office-permissions";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export { canEditTrackingAtOffice };

export const OFFICE_TOKEN_HEADER = "x-office-token";

export type OfficeAuthContext = {
  office: OfficeOption;
  token: string;
};

export async function resolveOfficeByToken(
  token: string
): Promise<OfficeOption | null> {
  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("office_access_tokens")
    .select("office_code")
    .eq("access_token", trimmed)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const office = data.office_code;
  return isValidOfficeOption(office) ? office : null;
}

export function getTokenFromRequest(request: NextRequest): string {
  const headerToken = request.headers.get(OFFICE_TOKEN_HEADER)?.trim();
  if (headerToken) {
    return headerToken;
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (/^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, "").trim();
  }

  return "";
}

export async function requireOfficeAuth(
  request: NextRequest
): Promise<OfficeAuthContext | NextResponse> {
  const token = getTokenFromRequest(request);
  const office = await resolveOfficeByToken(token);

  if (!office) {
    return NextResponse.json(
      { error: "Invalid or missing office access token." },
      { status: 401 }
    );
  }

  return { office, token };
}

export function isOfficeAuthContext(
  value: OfficeAuthContext | NextResponse
): value is OfficeAuthContext {
  return !(value instanceof NextResponse);
}

