import { NextRequest, NextResponse } from "next/server";
import {
  getRaceResults,
  getQualifyingResults,
  processRaceResults,
  addQualifyingData,
} from "@/lib/f1api";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const circuitId = searchParams.get("circuitId");
  const startYear = parseInt(searchParams.get("startYear") || "2015");
  const endYear = parseInt(searchParams.get("endYear") || "2024");

  if (!circuitId) {
    return NextResponse.json(
      { error: "circuitId is required" },
      { status: 400 }
    );
  }

  try {
    const [races, qualifying] = await Promise.all([
      getRaceResults(circuitId, startYear, endYear),
      getQualifyingResults(circuitId, startYear, endYear),
    ]);

    const { drivers, constructors, seasons } = processRaceResults(races);
    addQualifyingData(drivers, seasons, qualifying);

    return NextResponse.json({
      circuitId,
      startYear,
      endYear,
      drivers,
      constructors,
      seasons,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
