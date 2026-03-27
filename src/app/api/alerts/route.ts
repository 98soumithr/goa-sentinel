import { NextRequest, NextResponse } from "next/server";

// In-memory alert store for prototype
const acknowledgedAlerts = new Set<string>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { alertId, action, acknowledgedBy } = body;

  if (action === "acknowledge") {
    acknowledgedAlerts.add(alertId);
    return NextResponse.json({
      success: true,
      alertId,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    });
  }

  if (action === "resolve") {
    acknowledgedAlerts.add(alertId);
    return NextResponse.json({
      success: true,
      alertId,
      status: "resolved",
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({
    acknowledgedAlerts: Array.from(acknowledgedAlerts),
  });
}
