import { NextRequest, NextResponse } from 'next/server';
import { getChannelInfo } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get('id');

  if (!channelId) {
    return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
  }

  try {
    const channel = await getChannelInfo(channelId);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }
    return NextResponse.json({ channel });
  } catch (err: any) {
    if (err.message?.includes('quota')) {
      return NextResponse.json({ error: 'YouTube API quota exceeded' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 });
  }
}
