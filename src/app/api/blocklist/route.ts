import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { getBlocklist, addToBlocklist } from '@/lib/db/queries';

const addSchema = z.object({
  entry: z.string().min(1),
  entryType: z.enum(['domain', 'email', 'tool_signature']),
  reason: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const entries = await getBlocklist(session.user.id);
    return NextResponse.json({ data: entries });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch blocklist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = addSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const entry = await addToBlocklist({
      userId: session.user.id,
      ...parsed.data,
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add to blocklist' }, { status: 500 });
  }
}
