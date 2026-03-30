import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { getDefenseRules, createDefenseRule } from '@/lib/db/queries';

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['hard_block', 'intercept', 'qualify', 'delay', 'approve']),
  conditions: z.record(z.unknown()),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const rules = await getDefenseRules(session.user.id);
    return NextResponse.json({ data: rules });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const rule = await createDefenseRule({
      userId: session.user.id,
      ...parsed.data,
    });

    return NextResponse.json({ data: rule }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}
