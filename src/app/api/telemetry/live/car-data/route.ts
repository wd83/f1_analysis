import { NextRequest, NextResponse } from "next/server";
import { getLiveCarData } from "@/lib/openf1-live";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export interface LiveCarPoint {
  t: number; // epoch ms
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  drs: number;
  rpm: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const driverNumber = searchParams.get("driver_number");
  const sessionKey = searchParams.get("session_key") ?? "latest";
  const seconds = parseInt(searchParams.get("seconds") ?? "30");

  if (!driverNumber) {
    return NextResponse.json(
      { error: "driver_number is required" },
      { status: 400 }
    );
  }

  try {
    const key = sessionKey === "latest" ? "latest" : parseInt(sessionKey);
    const raw = await getLiveCarData(key, parseInt(driverNumber), seconds);

    const points: LiveCarPoint[] = raw
      .map((d) => ({
        t: new Date(d.date).getTime(),
        speed: d.speed,
        throttle: d.throttle,
        brake: d.brake,
        gear: d.n_gear,
        drs: d.drs,
        rpm: d.rpm,
      }))
      .sort((a, b) => a.t - b.t);

    return NextResponse.json(points, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch live car data" },
      { status: 500 }
    );
  }
}
