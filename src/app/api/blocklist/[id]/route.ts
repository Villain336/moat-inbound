import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { removeFromBlocklist } from '@/lib/db/queries';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    await removeFromBlocklist(params.id);
    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json({ error: 'Failed to remove entry' }, { status: 500 });
  }
}
