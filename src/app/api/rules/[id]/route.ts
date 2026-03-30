import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import {
  getDefenseRuleById,
  updateDefenseRule,
  toggleRule,
  deleteDefenseRule,
} from '@/lib/db/queries';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  severity: z.enum(['hard_block', 'intercept', 'qualify', 'delay', 'approve']).optional(),
  conditions: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
  toggle: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.toggle) {
      const rule = await toggleRule(params.id);
      return NextResponse.json({ data: rule });
    }

    const { toggle: _, ...updateData } = parsed.data;
    const rule = await updateDefenseRule(params.id, updateData);
    return NextResponse.json({ data: rule });
  } catch {
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const rule = await getDefenseRuleById(params.id);
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    if (rule.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system rules' }, { status: 403 });
    }
    await deleteDefenseRule(params.id);
    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
