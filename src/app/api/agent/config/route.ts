import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { getUserPreferences, updateUserPreferences } from '@/lib/db/queries';

const updateSchema = z.object({
  agentPosture: z.enum(['passive', 'defensive', 'aggressive']).optional(),
  capabilities: z.record(z.boolean()).optional(),
  qualificationQuestions: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const prefs = await getUserPreferences(session.user.id);
    return NextResponse.json({ data: prefs });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await updateUserPreferences(session.user.id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
