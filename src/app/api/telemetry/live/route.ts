import { NextRequest, NextResponse } from "next/server";
import { getLiveSnapshot } from "@/lib/openf1-live";

export const runtime = "edge";
// Never cache: this is the live polling endpoint.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Defaults to "latest" so the client doesn't need to know the session key.
  const sessionKey = request.nextUrl.searchParams.get("session_key") ?? "latest";

  try {
    const key = sessionKey === "latest" ? "latest" : parseInt(sessionKey);
    const snapshot = await getLiveSnapshot(key);

    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch live data" },
      { status: 500 }
    );
  }
}
