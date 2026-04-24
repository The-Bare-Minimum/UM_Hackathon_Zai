import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Briefing API coming in Phase 1" })
}
