import { getConnectedAccount, upsertConnectedAccount } from '@/lib/db/queries';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

interface OutlookMessage {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body: { contentType: string; content: string };
  from: {
    emailAddress: { name: string; address: string };
  };
  toRecipients: Array<{
    emailAddress: { name: string; address: string };
  }>;
  receivedDateTime: string;
  internetMessageHeaders?: Array<{ name: string; value: string }>;
  internetMessageId: string;
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
  const account = await getConnectedAccount(userId, 'outlook');
  if (!account?.accessToken) {
    throw new Error('No Outlook access token found. Please reconnect your Outlook account.');
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
  const response = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access',
      }),
    }
  );

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Failed to refresh Outlook access token');
  }

  await upsertConnectedAccount({
    userId,
    provider: 'outlook',
    providerAccountId: '',
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  });

  return data.access_token;
}

async function graphFetch(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${GRAPH_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft Graph API error (${response.status}): ${error}`);
  }

  return response.json();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseOutlookMessage(message: OutlookMessage): ParsedEmail {
  const headers: Record<string, string> = {};
  if (message.internetMessageHeaders) {
    for (const h of message.internetMessageHeaders) {
      headers[h.name.toLowerCase()] = h.value;
    }
  }

  const body =
    message.body.contentType === 'text'
      ? message.body.content
      : stripHtml(message.body.content);

  return {
    messageId: message.id,
    threadId: message.conversationId,
    from: message.from.emailAddress.address,
    fromName: message.from.emailAddress.name || null,
    to: message.toRecipients.map((r) => r.emailAddress.address).join(', '),
    subject: message.subject || '(No Subject)',
    body,
    bodyPreview: message.bodyPreview || body.slice(0, 300),
    headers,
    receivedAt: new Date(message.receivedDateTime),
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

  let filter = '';
  if (since) {
    filter = `&$filter=receivedDateTime ge ${since.toISOString()}`;
  }

  const response = await graphFetch(
    accessToken,
    `/me/mailFolders/inbox/messages?$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,receivedDateTime,internetMessageId&$expand=internetMessageHeaders${filter}`
  );

  if (!response.value || response.value.length === 0) {
    return [];
  }

  return response.value.map(parseOutlookMessage);
}

export async function getMessage(
  userId: string,
  messageId: string
): Promise<ParsedEmail> {
  const accessToken = await getAccessToken(userId);
  const message: OutlookMessage = await graphFetch(
    accessToken,
    `/me/messages/${messageId}?$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,receivedDateTime,internetMessageId&$expand=internetMessageHeaders`
  );
  return parseOutlookMessage(message);
}

export async function markAsRead(userId: string, messageId: string) {
  const accessToken = await getAccessToken(userId);
  return graphFetch(accessToken, `/me/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead: true }),
  });
}

export async function archiveMessage(userId: string, messageId: string) {
  const accessToken = await getAccessToken(userId);
  // Move to Archive folder
  return graphFetch(accessToken, `/me/messages/${messageId}/move`, {
    method: 'POST',
    body: JSON.stringify({ destinationId: 'archive' }),
  });
}

export async function trashMessage(userId: string, messageId: string) {
  const accessToken = await getAccessToken(userId);
  return graphFetch(accessToken, `/me/messages/${messageId}/move`, {
    method: 'POST',
    body: JSON.stringify({ destinationId: 'deleteditems' }),
  });
}

export async function sendReply(
  userId: string,
  messageId: string,
  body: string
) {
  const accessToken = await getAccessToken(userId);
  return graphFetch(accessToken, `/me/messages/${messageId}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      comment: body,
    }),
  });
}

export async function createSubscription(userId: string, webhookUrl: string) {
  const accessToken = await getAccessToken(userId);
  const expirationDateTime = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000
  ).toISOString(); // Max 3 days for mail

  return graphFetch(accessToken, '/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      changeType: 'created',
      notificationUrl: webhookUrl,
      resource: "me/mailFolders('inbox')/messages",
      expirationDateTime,
      clientState: process.env.OUTLOOK_WEBHOOK_SECRET || 'moat-defense',
    }),
  });
}

export async function renewSubscription(
  userId: string,
  subscriptionId: string
) {
  const accessToken = await getAccessToken(userId);
  const expirationDateTime = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  return graphFetch(accessToken, `/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ expirationDateTime }),
  });
}

export { type ParsedEmail };
