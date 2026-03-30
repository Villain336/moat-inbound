import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getAgentConversationById } from '@/lib/db/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const conversation = await getAgentConversationById(params.id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    return NextResponse.json({ data: conversation });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
