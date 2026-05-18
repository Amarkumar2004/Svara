import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetails } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
  }

  try {
    const video = await getVideoDetails(id);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    return NextResponse.json({ video });
  } catch (err: any) {
    if (err.message?.includes('quota')) {
      return NextResponse.json({ error: 'YouTube API quota exceeded' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}
