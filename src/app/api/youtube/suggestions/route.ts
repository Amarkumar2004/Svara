import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');

  if (!query?.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const results = await searchYouTube(query, 5);
    const suggestions = results.map((r: any) => ({
      type: 'song' as const,
      id: r.id,
      title: r.title,
      subtitle: r.channelTitle,
      image: r.thumbnail,
    }));
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
