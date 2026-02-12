import { NextResponse } from "next/server";
import { getCircuits } from "@/lib/f1api";

export async function GET() {
  try {
    const circuits = await getCircuits();
    return NextResponse.json(circuits);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch circuits" },
      { status: 500 }
    );
  }
}
