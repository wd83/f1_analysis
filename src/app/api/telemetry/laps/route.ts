import { NextRequest, NextResponse } from "next/server";
import { getLaps } from "@/lib/openf1";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");
  const driverNumber = searchParams.get("driver_number");

  if (!sessionKey || !driverNumber) {
    return NextResponse.json(
      { error: "session_key and driver_number are required" },
      { status: 400 }
    );
  }

  try {
    const laps = await getLaps(parseInt(sessionKey), parseInt(driverNumber));
    return NextResponse.json(laps, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch laps" },
      { status: 500 }
    );
  }
}
