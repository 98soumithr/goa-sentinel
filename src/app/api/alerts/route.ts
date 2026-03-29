import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { alertId, action, acknowledgedBy, resolutionNotes } = body;

  if (action === "acknowledge") {
    const { error } = await supabaseAdmin
      .from("alerts")
      .update({
        status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
      })
      .eq("id", alertId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alertId,
      status: "acknowledged",
    });
  }

  if (action === "resolve") {
    const { error } = await supabaseAdmin
      .from("alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: acknowledgedBy,
        resolution_notes: resolutionNotes || null,
      })
      .eq("id", alertId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alertId,
      status: "resolved",
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  const { data: alerts, error } = await supabaseAdmin
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts });
}
