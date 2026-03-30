import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { updateMessageStatus, getMessageById } from '@/lib/db/queries';

const schema = z.object({
  status: z.enum(['pending', 'blocked', 'intercepted', 'agent_handling', 'approved', 'quarantined']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const message = await getMessageById(params.id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const updated = await updateMessageStatus(params.id, parsed.data.status);
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
