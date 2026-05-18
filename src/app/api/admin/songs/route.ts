import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Songs are managed via YouTube API" }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Songs are managed via YouTube API" }, { status: 400 });
}
