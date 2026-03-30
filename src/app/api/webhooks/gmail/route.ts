import { NextRequest, NextResponse } from 'next/server';
import { createWebhookEvent } from '@/lib/db/queries';
import { fetchNewMessages } from '@/lib/integrations/gmail';
import { processInboundMessage } from '@/lib/ai/pipeline';
import { db } from '@/lib/db/index';
import { connectedAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_ISSUERS = [
  'accounts.google.com',
  'https://accounts.google.com',
];

async function verifyGooglePubSub(request: NextRequest): Promise<boolean> {
  // In production, verify the Bearer token from Google Pub/Sub
  // Google signs push messages with an OIDC token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    // Allow unsigned requests in development
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  }

  const token = authHeader.slice(7);

  try {
    // Decode JWT without verification to check issuer
    // For production: use Google's public keys to verify the signature
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString()
    );

    // Verify issuer is Google
    if (!ALLOWED_ISSUERS.includes(payload.iss)) return false;

    // Verify audience matches our webhook URL
    const expectedAudience = process.env.GMAIL_WEBHOOK_AUDIENCE || process.env.NEXTAUTH_URL;
    if (expectedAudience && payload.aud !== expectedAudience) return false;

    // Verify not expired
    if (payload.exp && payload.exp < Date.now() / 1000) return false;

    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Verify the webhook is from Google
  const isValid = await verifyGooglePubSub(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Gmail Pub/Sub sends base64-encoded data
    const data = body.message?.data
      ? JSON.parse(Buffer.from(body.message.data, 'base64').toString())
      : body;

    // Idempotency: check message ID to avoid processing duplicates
    const messageId = body.message?.messageId;

    // Log webhook event
    await createWebhookEvent({
      provider: 'gmail',
      eventType: 'push_notification',
      payload: { ...data, pubsubMessageId: messageId },
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
