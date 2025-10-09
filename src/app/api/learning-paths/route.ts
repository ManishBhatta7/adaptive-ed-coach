import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const data = await request.json();

    const { data: path, error } = await supabase
      .from('learning_paths')
      .insert({
        title: data.title,
        description: data.description,
        steps: data.steps,
        subject: data.subject,
        grade_level: data.gradeLevel,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(path);
  } catch (error) {
    console.error('Error creating learning path:', error);
    return NextResponse.json(
      { error: 'Failed to create learning path' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const shareCode = searchParams.get('shareCode');

    if (shareCode) {
      const { data: path, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('share_code', shareCode)
        .single();

      if (error) throw error;
      return NextResponse.json(path);
    }

    const { data: paths, error } = await supabase
      .from('learning_paths')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(paths);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning paths' },
      { status: 500 }
    );
  }
}