import { NextRequest, NextResponse } from 'next/server';
import { createWebhookEvent } from '@/lib/db/queries';
import { parseTwilioWebhook, validateTwilioSignature } from '@/lib/integrations/twilio';
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
  if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(request.url, body, signature)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await createWebhookEvent({
      provider: 'twilio',
      eventType: 'voice_response',
      payload: body,
    });

    // The caller spoke — their speech is in SpeechResult
    const speechResult = body.SpeechResult || '';

    if (!speechResult) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We did not catch that. Thank you for calling. Goodbye.</Say>
  <Hangup/>
</Response>`;
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

    // Process the speech through the pipeline as a phone message
    const parsed = parseTwilioWebhook({ ...body, Body: speechResult });

    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This number is not currently monitored. Goodbye.</Say>
  <Hangup/>
</Response>`;
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

    const result = await processInboundMessage(allUsers[0].id, parsed);

    let responseText: string;
    if (result.status === 'blocked') {
      responseText = 'Thank you for calling. Your inquiry has been noted. Goodbye.';
    } else if (result.status === 'approved') {
      responseText = 'Thank you. Your message has been forwarded. Someone will be in touch shortly. Goodbye.';
    } else {
      responseText = 'Thank you. Your inquiry has been logged and is under review. If this is legitimate, you will receive a callback. Goodbye.';
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${responseText}</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  } catch (error) {
    console.error('Twilio voice response error:', error);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We encountered an error. Please try again later. Goodbye.</Say>
  <Hangup/>
</Response>`;
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }
}
