import { NextRequest, NextResponse } from "next/server";
import { getCarData, getLocation, getLaps } from "@/lib/openf1";
import { processLocationData } from "@/lib/openf1-processing";

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

    const laps = await getLaps(sk, dn);
    const targetLap = laps.find((l) => l.lap_number === ln);
    const nextLap = laps.find((l) => l.lap_number === ln + 1);

    if (!targetLap) {
      return NextResponse.json({ error: "Lap not found" }, { status: 404 });
    }

    const dateGte = targetLap.date_start;
    let dateLt: string;
    if (nextLap) {
      dateLt = nextLap.date_start;
    } else if (targetLap.lap_duration) {
      dateLt = new Date(
        new Date(targetLap.date_start).getTime() +
          targetLap.lap_duration * 1000
      ).toISOString();
    } else {
      dateLt = new Date(
        new Date(targetLap.date_start).getTime() + 120000
      ).toISOString();
    }

    const [locationData, carData] = await Promise.all([
      getLocation(sk, dn, dateGte, dateLt),
      getCarData(sk, dn, dateGte, dateLt),
    ]);

    const processed = processLocationData(locationData, carData, 300);

    return NextResponse.json(processed, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch location data" },
      { status: 500 }
    );
  }
}
