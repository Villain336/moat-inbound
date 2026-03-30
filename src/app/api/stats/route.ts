import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getDailyStats } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;

    const since = searchParams.get('since')
      ? new Date(searchParams.get('since')!)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const until = searchParams.get('until')
      ? new Date(searchParams.get('until')!)
      : new Date();

    const stats = await getDailyStats(session.user.id, { since, until });
    return NextResponse.json({ data: stats });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
