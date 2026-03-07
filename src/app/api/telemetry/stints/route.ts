import { NextRequest, NextResponse } from "next/server";
import { getStints } from "@/lib/openf1";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const sessionKey = request.nextUrl.searchParams.get("session_key");

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    const stints = await getStints(parseInt(sessionKey));
    return NextResponse.json(stints, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stints" },
      { status: 500 }
    );
  }
}
