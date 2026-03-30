import { NextRequest, NextResponse } from 'next/server';
import { createWebhookEvent } from '@/lib/db/queries';
import { fetchNewMessages } from '@/lib/integrations/gmail';
import { processInboundMessage } from '@/lib/ai/pipeline';
import { db } from '@/lib/db/index';
import { connectedAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Gmail Pub/Sub sends base64-encoded data
    const data = body.message?.data
      ? JSON.parse(Buffer.from(body.message.data, 'base64').toString())
      : body;

    // Log webhook event
    await createWebhookEvent({
      provider: 'gmail',
      eventType: 'push_notification',
      payload: data,
    });

    const emailAddress = data.emailAddress;
    if (!emailAddress) {
      return NextResponse.json({ error: 'No email address in payload' }, { status: 400 });
    }

    // Find the user by their connected Gmail account
    const accounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.provider, 'gmail'));

    const account = accounts.find(
      (a) => a.providerAccountId === emailAddress || a.providerAccountId === ''
    );

    if (!account) {
      return NextResponse.json({ error: 'No matching connected account' }, { status: 404 });
    }

    const userId = account.userId;

    // Fetch new messages since last sync
    const since = account.lastSyncAt || new Date(Date.now() - 5 * 60 * 1000);
    const messages = await fetchNewMessages(userId, since);

    // Process each new message through the pipeline
    const results = [];
    for (const email of messages) {
      try {
        const result = await processInboundMessage(userId, email);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process message ${email.messageId}:`, error);
      }
    }

    // Update last sync time
    await db
      .update(connectedAccounts)
      .set({ lastSyncAt: new Date() })
      .where(eq(connectedAccounts.id, account.id));

    return NextResponse.json({
      data: { processed: results.length },
    });
  } catch (error) {
    console.error('Gmail webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
