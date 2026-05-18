import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  const maxResults = parseInt(req.nextUrl.searchParams.get('maxResults') || '20');

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    const results = await searchYouTube(query, maxResults);
    return NextResponse.json({ results });
  } catch (err: any) {
    if (err.message?.includes('quota')) {
      return NextResponse.json({ error: 'YouTube API quota exceeded', results: [] }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to search YouTube', results: [] }, { status: 500 });
  }
}
