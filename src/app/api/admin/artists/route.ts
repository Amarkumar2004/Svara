import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Artists are managed via YouTube API" }, { status: 400 });
}
