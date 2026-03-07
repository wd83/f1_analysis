import { NextRequest, NextResponse } from "next/server";
import { getSessions } from "@/lib/openf1";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const meetingKey = request.nextUrl.searchParams.get("meeting_key");

  if (!meetingKey) {
    return NextResponse.json(
      { error: "meeting_key is required" },
      { status: 400 }
    );
  }

  try {
    const sessions = await getSessions(parseInt(meetingKey));
    return NextResponse.json(sessions, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
