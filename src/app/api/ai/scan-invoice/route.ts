import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ message: "Scan Invoice API coming in Phase 1" })
}
