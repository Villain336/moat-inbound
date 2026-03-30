import { NextRequest, NextResponse } from 'next/server';
import { createWebhookEvent } from '@/lib/db/queries';
import {
  parseTwilioWebhook,
  validateTwilioSignature,
  generateTwiMLResponse,
} from '@/lib/integrations/twilio';
import { processInboundMessage } from '@/lib/ai/pipeline';
import { db } from '@/lib/db/index';
import { users } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => {
    body[key] = value.toString();
  });

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') || '';
  const url = request.url;
  if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(url, body, signature)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Log webhook event
    await createWebhookEvent({
      provider: 'twilio',
      eventType: body.CallSid ? 'voice' : 'sms',
      payload: body,
    });

    const parsed = parseTwilioWebhook(body);

    // Find the first user to process against (multi-tenant: match by Twilio number)
    // For now, process against the first user in the system
    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
      return new NextResponse(
        generateTwiMLResponse('This number is not currently monitored.'),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const userId = allUsers[0].id;

    // Run through the same classification pipeline
    const result = await processInboundMessage(userId, parsed);

    // Generate response based on classification
    let responseMessage: string;

    if (result.status === 'blocked') {
      responseMessage = 'Your message has been received and reviewed. No further action is needed at this time.';
    } else if (result.status === 'intercepted' || result.action === 'agent_started') {
      responseMessage = 'Thank you for reaching out. Before I connect you, could you briefly describe the specific reason for your contact and how you got this number?';
    } else {
      responseMessage = 'Thank you for your message. It has been forwarded to the appropriate person.';
    }

    return new NextResponse(generateTwiMLResponse(responseMessage), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Twilio webhook error:', error);
    return new NextResponse(
      generateTwiMLResponse('We are unable to process your request at this time.'),
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
}
