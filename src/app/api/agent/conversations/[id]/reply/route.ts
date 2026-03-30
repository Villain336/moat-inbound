import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { userOverrideReply } from '@/lib/ai/agent';

const schema = z.object({
  content: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const conversation = await userOverrideReply(
      session.user.id,
      params.id,
      parsed.data.content
    );

    return NextResponse.json({ data: conversation });
  } catch {
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
