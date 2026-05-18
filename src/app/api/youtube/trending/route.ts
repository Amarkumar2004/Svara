import { NextResponse } from 'next/server';
import { getTrending } from '@/lib/youtube';

export async function GET() {
  try {
    const results = await getTrending(20);
    return NextResponse.json({ results });
  } catch (err: any) {
    if (err.message?.includes('quota')) {
      return NextResponse.json({ error: 'YouTube API quota exceeded', results: [] }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to fetch trending', results: [] }, { status: 500 });
  }
}
