import { NextRequest, NextResponse } from "next/server";
import { getDrivers } from "@/lib/openf1";

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
    const drivers = await getDrivers(parseInt(sessionKey));
    // Deduplicate by driver_number (API can return duplicates)
    const seen = new Set<number>();
    const unique = drivers.filter((d) => {
      if (seen.has(d.driver_number)) return false;
      seen.add(d.driver_number);
      return true;
    });
    return NextResponse.json(unique, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}
