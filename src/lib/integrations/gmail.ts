import { getConnectedAccount, upsertConnectedAccount } from '@/lib/db/queries';

const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1';

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    mimeType: string;
    body?: { data?: string; size: number };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; size: number };
      parts?: Array<{
        mimeType: string;
        body?: { data?: string; size: number };
      }>;
    }>;
  };
  internalDate: string;
}

interface ParsedEmail {
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
}

async function getAccessToken(userId: string): Promise<string> {
  const account = await getConnectedAccount(userId, 'gmail');
  if (!account?.accessToken) {
    throw new Error('No Gmail access token found. Please reconnect your Gmail account.');
  }

  if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
    return refreshAccessToken(userId, account.refreshToken!);
  }

  return account.accessToken;
}

async function refreshAccessToken(
  userId: string,
  refreshToken: string
): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Failed to refresh Gmail access token');
  }

  await upsertConnectedAccount({
    userId,
    provider: 'gmail',
    providerAccountId: '',
    accessToken: data.access_token,
    refreshToken,
    tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  });

  return data.access_token;
}

async function gmailFetch(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error (${response.status}): ${error}`);
  }

  return response.json();
}

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function extractBody(payload: GmailMessage['payload']): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    // Prefer text/plain, fall back to text/html
    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Check nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = part.parts.find((p) => p.mimeType === 'text/plain');
        if (nested?.body?.data) {
          return decodeBase64Url(nested.body.data);
        }
      }
    }
  }

  return '';
}

function parseEmailAddress(raw: string): { email: string; name: string | null } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() };
  }
  return { name: null, email: raw.trim() };
}

function parseGmailMessage(message: GmailMessage): ParsedEmail {
  const headers: Record<string, string> = {};
  for (const h of message.payload.headers) {
    headers[h.name.toLowerCase()] = h.value;
  }

  const fromRaw = headers['from'] || '';
  const { name, email } = parseEmailAddress(fromRaw);
  const body = extractBody(message.payload);

  return {
    messageId: message.id,
    threadId: message.threadId,
    from: email,
    fromName: name,
    to: headers['to'] || '',
    subject: headers['subject'] || '(No Subject)',
    body,
    bodyPreview: body.slice(0, 300),
    headers,
    receivedAt: new Date(parseInt(message.internalDate)),
    inReplyTo: headers['in-reply-to'] || null,
    references: (headers['references'] || '').split(/\s+/).filter(Boolean),
  };
}

// ——— Public API ———

export async function fetchNewMessages(
  userId: string,
  since?: Date
): Promise<ParsedEmail[]> {
  const accessToken = await getAccessToken(userId);

  let query = 'in:inbox';
  if (since) {
    const epochSeconds = Math.floor(since.getTime() / 1000);
    query += ` after:${epochSeconds}`;
  }

  const listResponse = await gmailFetch(
    accessToken,
    `/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`
  );

  if (!listResponse.messages || listResponse.messages.length === 0) {
    return [];
  }

  const messages: ParsedEmail[] = [];

  for (const msg of listResponse.messages) {
    const fullMessage: GmailMessage = await gmailFetch(
      accessToken,
      `/users/me/messages/${msg.id}?format=full`
    );
    messages.push(parseGmailMessage(fullMessage));
  }

  return messages;
}

export async function getMessage(
  userId: string,
  messageId: string
): Promise<ParsedEmail> {
  const accessToken = await getAccessToken(userId);
  const message: GmailMessage = await gmailFetch(
    accessToken,
    `/users/me/messages/${messageId}?format=full`
  );
  return parseGmailMessage(message);
}

export async function getMessageHeaders(
  userId: string,
  messageId: string
): Promise<Record<string, string>> {
  const accessToken = await getAccessToken(userId);
  const message: GmailMessage = await gmailFetch(
    accessToken,
    `/users/me/messages/${messageId}?format=metadata&metadataHeaders=X-Mailer&metadataHeaders=List-Unsubscribe&metadataHeaders=Received-SPF&metadataHeaders=X-Mailgun-Sid&metadataHeaders=X-SES-Outgoing`
  );

  const headers: Record<string, string> = {};
  for (const h of message.payload.headers) {
    headers[h.name.toLowerCase()] = h.value;
  }
  return headers;
}

export async function markAsRead(userId: string, messageId: string) {
  const accessToken = await getAccessToken(userId);
  return gmailFetch(accessToken, `/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  });
}

export async function archiveMessage(userId: string, messageId: string) {
  const accessToken = await getAccessToken(userId);
  return gmailFetch(accessToken, `/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
  });
}

export async function trashMessage(userId: string, messageId: string) {
  const accessToken = await getAccessToken(userId);
  return gmailFetch(accessToken, `/users/me/messages/${messageId}/trash`, {
    method: 'POST',
  });
}

export async function sendReply(
  userId: string,
  threadId: string,
  to: string,
  subject: string,
  body: string
) {
  const accessToken = await getAccessToken(userId);

  const rawMessage = [
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
  ].join('\r\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return gmailFetch(accessToken, '/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      raw: encodedMessage,
      threadId,
    }),
  });
}

export async function watchInbox(userId: string) {
  const accessToken = await getAccessToken(userId);
  return gmailFetch(accessToken, '/users/me/watch', {
    method: 'POST',
    body: JSON.stringify({
      topicName: process.env.GMAIL_PUBSUB_TOPIC || 'projects/moat-defense/topics/gmail-push',
      labelIds: ['INBOX'],
    }),
  });
}

export async function stopWatch(userId: string) {
  const accessToken = await getAccessToken(userId);
  return gmailFetch(accessToken, '/users/me/stop', { method: 'POST' });
}

export { type ParsedEmail };
