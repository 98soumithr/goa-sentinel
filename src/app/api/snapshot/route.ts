import { NextResponse } from "next/server";
import { realDashboardSnapshot } from "@/mock-data/real-data";

export async function GET() {
  const snapshot = realDashboardSnapshot();
  return NextResponse.json(snapshot);
}
