import { NextResponse } from "next/server";
import { generateDashboardSnapshot } from "@/mock-data/generator";

export async function GET() {
  const snapshot = generateDashboardSnapshot();
  return NextResponse.json(snapshot);
}
