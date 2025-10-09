import { createClient } from '@/lib/supabase';
import { extractVideoId, getVideoDetails } from '@/lib/youtube-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoDetails = await getVideoDetails(params.id);
    return NextResponse.json(videoDetails);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch video details' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { url } = await request.json();
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const videoDetails = await getVideoDetails(videoId);
    return NextResponse.json(videoDetails);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    );
  }
}