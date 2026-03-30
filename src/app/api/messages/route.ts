import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getInboundMessages } from '@/lib/db/queries';
import type { MessageStatus, Classification } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;

    const result = await getInboundMessages(session.user.id, {
      status: (searchParams.get('status') as MessageStatus) || undefined,
      classification: (searchParams.get('classification') as Classification) || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '50', 10),
      since: searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined,
      until: searchParams.get('until') ? new Date(searchParams.get('until')!) : undefined,
    });

    return NextResponse.json({
      data: result.messages,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
