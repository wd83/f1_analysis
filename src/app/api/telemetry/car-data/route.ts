import { NextRequest, NextResponse } from "next/server";
import { getCarData, getLaps } from "@/lib/openf1";
import { processCarData } from "@/lib/openf1-processing";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");
  const driverNumber = searchParams.get("driver_number");
  const lapNumber = searchParams.get("lap_number");

  if (!sessionKey || !driverNumber || !lapNumber) {
    return NextResponse.json(
      { error: "session_key, driver_number, and lap_number are required" },
      { status: 400 }
    );
  }

  try {
    const sk = parseInt(sessionKey);
    const dn = parseInt(driverNumber);
    const ln = parseInt(lapNumber);

    // Get lap timestamps to bound the car data query
    const laps = await getLaps(sk, dn);
    const targetLap = laps.find((l) => l.lap_number === ln);
    const nextLap = laps.find((l) => l.lap_number === ln + 1);

    if (!targetLap) {
      return NextResponse.json(
        { error: "Lap not found" },
        { status: 404 }
      );
    }

    const dateGte = targetLap.date_start;
    // Use next lap start or add lap duration
    let dateLt: string;
    if (nextLap) {
      dateLt = nextLap.date_start;
    } else if (targetLap.lap_duration) {
      const end = new Date(
        new Date(targetLap.date_start).getTime() +
          targetLap.lap_duration * 1000
      );
      dateLt = end.toISOString();
    } else {
      // Fallback: add 2 minutes
      const end = new Date(
        new Date(targetLap.date_start).getTime() + 120000
      );
      dateLt = end.toISOString();
    }

    const rawData = await getCarData(sk, dn, dateGte, dateLt);
    const processed = processCarData(rawData, 400);

    return NextResponse.json(processed, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch car data" },
      { status: 500 }
    );
  }
}
