import { NextRequest, NextResponse } from 'next/server';
import { createWebhookEvent } from '@/lib/db/queries';
import { fetchNewMessages } from '@/lib/integrations/outlook';
import { processInboundMessage } from '@/lib/ai/pipeline';
import { db } from '@/lib/db/index';
import { connectedAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  // Microsoft Graph sends a validation request on subscription creation
  const validationToken = url.searchParams.get('validationToken');
  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    const body = await request.json();

    // Verify clientState to ensure the webhook is legitimate
    const expectedState = process.env.OUTLOOK_WEBHOOK_SECRET || 'moat-defense';

    for (const notification of body.value || []) {
      if (notification.clientState !== expectedState) {
        console.warn('Invalid clientState in Outlook webhook');
        continue;
      }

      await createWebhookEvent({
        provider: 'outlook',
        eventType: notification.changeType || 'created',
        payload: notification,
      });

      // Find user by subscription — for now find all outlook accounts
      const accounts = await db
        .select()
        .from(connectedAccounts)
        .where(eq(connectedAccounts.provider, 'outlook'));

      for (const account of accounts) {
        const userId = account.userId;
        const since = account.lastSyncAt || new Date(Date.now() - 5 * 60 * 1000);

        try {
          const messages = await fetchNewMessages(userId, since);
          for (const email of messages) {
            try {
              await processInboundMessage(userId, email);
            } catch (error) {
              console.error(`Failed to process Outlook message:`, error);
            }
          }

          await db
            .update(connectedAccounts)
            .set({ lastSyncAt: new Date() })
            .where(eq(connectedAccounts.id, account.id));
        } catch (error) {
          console.error(`Failed to fetch Outlook messages for user ${userId}:`, error);
        }
      }
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('Outlook webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
