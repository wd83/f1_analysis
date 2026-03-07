import { NextRequest, NextResponse } from "next/server";
import { getMeetings } from "@/lib/openf1";
import {
  getCountryForCircuit,
  getMeetingHint,
} from "@/lib/circuit-mapping";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const circuitId = searchParams.get("circuitId");

  if (!year || !circuitId) {
    return NextResponse.json(
      { error: "year and circuitId are required" },
      { status: 400 }
    );
  }

  const country = getCountryForCircuit(circuitId);
  if (!country) {
    return NextResponse.json(
      { error: "Circuit not mapped for telemetry data" },
      { status: 404 }
    );
  }

  try {
    const meetings = await getMeetings(parseInt(year), country);
    const hint = getMeetingHint(circuitId);

    // If there's a hint (e.g. for US circuits), filter by meeting name
    let filtered = meetings;
    if (hint && meetings.length > 1) {
      filtered = meetings.filter((m) =>
        m.meeting_name.toLowerCase().includes(hint.toLowerCase())
      );
      if (filtered.length === 0) filtered = meetings;
    }

    return NextResponse.json(filtered, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
