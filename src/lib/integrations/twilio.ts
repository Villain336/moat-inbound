import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const moatPhoneNumber = process.env.TWILIO_PHONE_NUMBER!;

function getClient() {
  return twilio(accountSid, authToken);
}

export interface ParsedSMS {
  messageId: string;
  threadId: string;
  from: string;
  fromName: string | null;
  to: string;
  subject: string;
  body: string;
  bodyPreview: string;
  headers: Record<string, string>;
  receivedAt: Date;
  inReplyTo: string | null;
  references: string[];
  channel: 'sms' | 'phone';
}

export function parseTwilioWebhook(body: Record<string, string>): ParsedSMS {
  const from = body.From || '';
  const to = body.To || '';
  const messageBody = body.Body || '';
  const messageSid = body.MessageSid || body.CallSid || '';
  const isVoice = !!body.CallSid;

  return {
    messageId: messageSid,
    threadId: from, // group by sender phone number
    from,
    fromName: body.CallerName || null,
    to,
    subject: isVoice ? `Phone call from ${from}` : `SMS from ${from}`,
    body: isVoice
      ? body.TranscriptionText || body.SpeechResult || `Incoming call from ${from}`
      : messageBody,
    bodyPreview: isVoice
      ? (body.TranscriptionText || body.SpeechResult || `Incoming call`).slice(0, 300)
      : messageBody.slice(0, 300),
    headers: {
      'x-twilio-sid': messageSid,
      'x-twilio-from': from,
      'x-twilio-to': to,
      'x-twilio-city': body.FromCity || '',
      'x-twilio-state': body.FromState || '',
      'x-twilio-country': body.FromCountry || '',
    },
    receivedAt: new Date(),
    inReplyTo: null,
    references: [],
    channel: isVoice ? 'phone' : 'sms',
  };
}

export async function sendSMS(to: string, body: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    body,
    from: moatPhoneNumber,
    to,
  });
  return message.sid;
}

export async function sendAgentSMSReply(
  to: string,
  agentReply: string
): Promise<string> {
  return sendSMS(to, agentReply);
}

export function generateTwiMLResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

export function generateTwiMLVoiceResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(message)}</Say>
  <Gather input="speech" action="/api/webhooks/twilio/voice-response" method="POST" speechTimeout="auto">
    <Say voice="alice">Please state the purpose of your call after the tone.</Say>
  </Gather>
  <Say voice="alice">We did not receive a response. Goodbye.</Say>
</Response>`;
}

export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const webhookSecret = process.env.TWILIO_WEBHOOK_SECRET || process.env.TWILIO_AUTH_TOKEN;
  if (!webhookSecret) return false;

  return twilio.validateRequest(
    webhookSecret,
    signature,
    url,
    params
  );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
