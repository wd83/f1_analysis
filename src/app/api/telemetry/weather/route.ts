import { NextRequest, NextResponse } from "next/server";
import { getWeather } from "@/lib/openf1";

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
    const weather = await getWeather(parseInt(sessionKey));
    // Return only the latest weather reading
    if (weather.length > 0) {
      return NextResponse.json(weather[weather.length - 1], {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }
    return NextResponse.json(null);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 500 }
    );
  }
}
