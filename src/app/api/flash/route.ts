import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { IS_PROTOTYPE, MOCK_FLASH_DESIGNS } from '@/lib/mock-data';

export async function GET() {
  if (IS_PROTOTYPE) {
    return NextResponse.json({ designs: MOCK_FLASH_DESIGNS });
  }

  const supabase = createAdminClient();
  const { data: designs } = await supabase
    .from('flash_designs')
    .select('*')
    .eq('is_available', true)
    .order('sort_order');

  return NextResponse.json({ designs: designs || [] });
}

export async function POST(request: NextRequest) {
  if (IS_PROTOTYPE) {
    return NextResponse.json({ error: 'Connect Supabase to upload designs' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const { data: design, error } = await supabase
      .from('flash_designs')
      .insert({
        title: body.title,
        description: body.description || null,
        style: body.style || null,
        image_path: body.image_path,
        suggested_size: body.suggested_size || null,
        is_available: body.is_available ?? true,
        sort_order: body.sort_order || 0,
        tags: body.tags || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ design });
  } catch (error) {
    console.error('Create flash design error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (IS_PROTOTYPE) {
    return NextResponse.json({ error: 'Connect Supabase to manage designs' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('flash_designs').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
