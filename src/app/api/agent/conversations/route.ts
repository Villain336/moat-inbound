import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { listAgentConversations } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await requireAuth();
    const conversations = await listAgentConversations(session.user.id);
    return NextResponse.json({ data: conversations });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
