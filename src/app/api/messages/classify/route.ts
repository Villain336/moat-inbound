import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { classifyMessage } from '@/lib/ai/classifier';

const schema = z.object({
  subject: z.string(),
  body: z.string(),
  senderEmail: z.string(),
  senderName: z.string().nullable().optional(),
  headers: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await classifyMessage(
      parsed.data.subject,
      parsed.data.body,
      parsed.data.senderEmail,
      parsed.data.senderName ?? null,
      parsed.data.headers
    );

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 });
  }
}
