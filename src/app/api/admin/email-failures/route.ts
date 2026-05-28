import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Count undismissed failures from the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('email_failures')
      .select('*', { count: 'exact', head: true })
      .eq('dismissed', false)
      .gte('created_at', since);

    if (error) {
      console.error('[EMAIL_FAILURES] Failed to fetch count:', error.message);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err) {
    console.error('[EMAIL_FAILURES] GET error:', err);
    return NextResponse.json({ count: 0 });
  }
}

export async function DELETE() {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('email_failures')
      .update({ dismissed: true })
      .eq('dismissed', false);

    if (error) {
      console.error('[EMAIL_FAILURES] Failed to dismiss:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[EMAIL_FAILURES] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
