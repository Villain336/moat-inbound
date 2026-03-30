import { eq, and, desc, gte, lte, sql, inArray } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  connectedAccounts,
  inboundMessages,
  agentConversations,
  agentMessages,
  defenseRules,
  allowlist,
  blocklist,
  qualificationScripts,
  agentCapabilities,
  dailyStats,
  webhookEvents,
} from './schema';
import type {
  MessageStatus,
  Classification,
  AgentPosture,
  RuleSeverity,
} from '@/types';

// ——— Users ———

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(data: {
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    avatarUrl: string;
    plan: string;
    agentPosture: AgentPosture;
    onboardingComplete: boolean;
  }>
) {
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

// ——— Connected Accounts ———

export async function getConnectedAccounts(userId: string) {
  return db
    .select()
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId));
}

export async function getConnectedAccount(userId: string, provider: string) {
  const result = await db
    .select()
    .from(connectedAccounts)
    .where(
      and(
        eq(connectedAccounts.userId, userId),
        eq(connectedAccounts.provider, provider)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function upsertConnectedAccount(data: {
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}) {
  const existing = await getConnectedAccount(data.userId, data.provider);
  if (existing) {
    const result = await db
      .update(connectedAccounts)
      .set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiry: data.tokenExpiry,
        providerAccountId: data.providerAccountId,
      })
      .where(eq(connectedAccounts.id, existing.id))
      .returning();
    return result[0];
  }
  const result = await db
    .insert(connectedAccounts)
    .values(data)
    .returning();
  return result[0];
}

// ——— Inbound Messages ———

export async function getInboundMessages(
  userId: string,
  filters: {
    status?: MessageStatus;
    classification?: Classification;
    page?: number;
    limit?: number;
    since?: Date;
    until?: Date;
  } = {}
) {
  const { status, classification, page = 1, limit = 50, since, until } = filters;
  const offset = (page - 1) * limit;

  const conditions = [eq(inboundMessages.userId, userId)];
  if (status) conditions.push(eq(inboundMessages.status, status));
  if (classification)
    conditions.push(eq(inboundMessages.classification, classification));
  if (since) conditions.push(gte(inboundMessages.receivedAt, since));
  if (until) conditions.push(lte(inboundMessages.receivedAt, until));

  const [messages, countResult] = await Promise.all([
    db
      .select()
      .from(inboundMessages)
      .where(and(...conditions))
      .orderBy(desc(inboundMessages.receivedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(inboundMessages)
      .where(and(...conditions)),
  ]);

  return {
    messages,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getMessageById(messageId: string) {
  const result = await db
    .select()
    .from(inboundMessages)
    .where(eq(inboundMessages.id, messageId))
    .limit(1);
  return result[0] ?? null;
}

export async function getMessageByExternalId(
  userId: string,
  externalMessageId: string
) {
  const result = await db
    .select()
    .from(inboundMessages)
    .where(
      and(
        eq(inboundMessages.userId, userId),
        eq(inboundMessages.externalMessageId, externalMessageId)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function createInboundMessage(data: {
  userId: string;
  externalMessageId?: string;
  channel: 'email' | 'linkedin' | 'twitter' | 'other';
  senderEmail?: string;
  senderName?: string;
  senderCompany?: string;
  senderDomain?: string;
  subject?: string;
  bodyPreview?: string;
  bodyFull?: string;
  threatScore?: number;
  classification?: Classification;
  toolDetected?: string;
  toolConfidence?: number;
  status?: MessageStatus;
  aiAnalysis?: Record<string, unknown>;
  matchedRules?: string[];
  receivedAt?: Date;
  processedAt?: Date;
}) {
  const result = await db.insert(inboundMessages).values(data).returning();
  return result[0];
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus
) {
  const result = await db
    .update(inboundMessages)
    .set({ status })
    .where(eq(inboundMessages.id, messageId))
    .returning();
  return result[0];
}

export async function updateMessage(
  messageId: string,
  data: Partial<{
    threatScore: number;
    classification: Classification;
    toolDetected: string | null;
    toolConfidence: number;
    status: MessageStatus;
    aiAnalysis: Record<string, unknown>;
    matchedRules: string[];
    processedAt: Date;
  }>
) {
  const result = await db
    .update(inboundMessages)
    .set(data)
    .where(eq(inboundMessages.id, messageId))
    .returning();
  return result[0];
}

// ——— Defense Rules ———

export async function getDefenseRules(userId: string) {
  return db
    .select()
    .from(defenseRules)
    .where(eq(defenseRules.userId, userId))
    .orderBy(desc(defenseRules.isSystem), defenseRules.createdAt);
}

export async function getDefenseRuleById(ruleId: string) {
  const result = await db
    .select()
    .from(defenseRules)
    .where(eq(defenseRules.id, ruleId))
    .limit(1);
  return result[0] ?? null;
}

export async function createDefenseRule(data: {
  userId: string;
  name: string;
  description?: string;
  severity: RuleSeverity;
  conditions: Record<string, unknown>;
  isSystem?: boolean;
}) {
  const result = await db.insert(defenseRules).values(data).returning();
  return result[0];
}

export async function updateDefenseRule(
  ruleId: string,
  data: Partial<{
    name: string;
    description: string;
    severity: RuleSeverity;
    conditions: Record<string, unknown>;
    isEnabled: boolean;
  }>
) {
  const result = await db
    .update(defenseRules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(defenseRules.id, ruleId))
    .returning();
  return result[0];
}

export async function toggleRule(ruleId: string) {
  const rule = await getDefenseRuleById(ruleId);
  if (!rule) return null;
  return updateDefenseRule(ruleId, { isEnabled: !rule.isEnabled });
}

export async function deleteDefenseRule(ruleId: string) {
  return db.delete(defenseRules).where(eq(defenseRules.id, ruleId));
}

export async function incrementRuleTriggerCount(ruleIds: string[]) {
  if (ruleIds.length === 0) return;
  await db
    .update(defenseRules)
    .set({
      timesTriggered: sql`${defenseRules.timesTriggered} + 1`,
      updatedAt: new Date(),
    })
    .where(inArray(defenseRules.id, ruleIds));
}

// ——— Allowlist ———

export async function getAllowlist(userId: string) {
  return db
    .select()
    .from(allowlist)
    .where(eq(allowlist.userId, userId))
    .orderBy(desc(allowlist.createdAt));
}

export async function addToAllowlist(data: {
  userId: string;
  entry: string;
  entryType: string;
  notes?: string;
  addedBy?: string;
}) {
  const result = await db.insert(allowlist).values(data).returning();
  return result[0];
}

export async function removeFromAllowlist(id: string) {
  return db.delete(allowlist).where(eq(allowlist.id, id));
}

export async function checkAllowlist(userId: string, senderEmail: string) {
  const domain = senderEmail.split('@')[1];
  const entries = await db
    .select()
    .from(allowlist)
    .where(eq(allowlist.userId, userId));

  return entries.some(
    (e) =>
      (e.entryType === 'email' && e.entry.toLowerCase() === senderEmail.toLowerCase()) ||
      (e.entryType === 'domain' && domain?.toLowerCase() === e.entry.toLowerCase())
  );
}

// ——— Blocklist ———

export async function getBlocklist(userId: string) {
  return db
    .select()
    .from(blocklist)
    .where(eq(blocklist.userId, userId))
    .orderBy(desc(blocklist.createdAt));
}

export async function addToBlocklist(data: {
  userId: string;
  entry: string;
  entryType: string;
  reason?: string;
  addedBy?: string;
}) {
  const result = await db.insert(blocklist).values(data).returning();
  return result[0];
}

export async function removeFromBlocklist(id: string) {
  return db.delete(blocklist).where(eq(blocklist.id, id));
}

export async function checkBlocklist(userId: string, senderEmail: string) {
  const domain = senderEmail.split('@')[1];
  const entries = await db
    .select()
    .from(blocklist)
    .where(eq(blocklist.userId, userId));

  return entries.some(
    (e) =>
      (e.entryType === 'email' && e.entry.toLowerCase() === senderEmail.toLowerCase()) ||
      (e.entryType === 'domain' && domain?.toLowerCase() === e.entry.toLowerCase())
  );
}

// ——— Daily Stats ———

export async function getDailyStats(
  userId: string,
  dateRange: { since: Date; until: Date }
) {
  return db
    .select()
    .from(dailyStats)
    .where(
      and(
        eq(dailyStats.userId, userId),
        gte(dailyStats.date, dateRange.since),
        lte(dailyStats.date, dateRange.until)
      )
    )
    .orderBy(dailyStats.date);
}

export async function upsertDailyStats(
  userId: string,
  date: Date,
  increment: {
    blocked?: number;
    intercepted?: number;
    approved?: number;
    agentConversations?: number;
    toolDetected?: string;
  }
) {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);

  const existing = await db
    .select()
    .from(dailyStats)
    .where(
      and(eq(dailyStats.userId, userId), eq(dailyStats.date, dateStart))
    )
    .limit(1);

  if (existing[0]) {
    const toolsDetected =
      (existing[0].toolsDetected as Record<string, number>) || {};
    if (increment.toolDetected) {
      toolsDetected[increment.toolDetected] =
        (toolsDetected[increment.toolDetected] || 0) + 1;
    }

    return db
      .update(dailyStats)
      .set({
        blocked: sql`${dailyStats.blocked} + ${increment.blocked || 0}`,
        intercepted: sql`${dailyStats.intercepted} + ${increment.intercepted || 0}`,
        approved: sql`${dailyStats.approved} + ${increment.approved || 0}`,
        agentConversations: sql`${dailyStats.agentConversations} + ${increment.agentConversations || 0}`,
        toolsDetected,
      })
      .where(eq(dailyStats.id, existing[0].id))
      .returning();
  }

  const toolsDetected: Record<string, number> = {};
  if (increment.toolDetected) {
    toolsDetected[increment.toolDetected] = 1;
  }

  return db
    .insert(dailyStats)
    .values({
      userId,
      date: dateStart,
      blocked: increment.blocked || 0,
      intercepted: increment.intercepted || 0,
      approved: increment.approved || 0,
      agentConversations: increment.agentConversations || 0,
      toolsDetected,
    })
    .returning();
}

// ——— Agent Conversations ———

export async function getAgentConversation(messageId: string) {
  const convo = await db
    .select()
    .from(agentConversations)
    .where(eq(agentConversations.messageId, messageId))
    .limit(1);

  if (!convo[0]) return null;

  const messages = await db
    .select()
    .from(agentMessages)
    .where(eq(agentMessages.conversationId, convo[0].id))
    .orderBy(agentMessages.createdAt);

  return { ...convo[0], messages };
}

export async function getAgentConversationById(conversationId: string) {
  const convo = await db
    .select()
    .from(agentConversations)
    .where(eq(agentConversations.id, conversationId))
    .limit(1);

  if (!convo[0]) return null;

  const messages = await db
    .select()
    .from(agentMessages)
    .where(eq(agentMessages.conversationId, convo[0].id))
    .orderBy(agentMessages.createdAt);

  return { ...convo[0], messages };
}

export async function listAgentConversations(userId: string) {
  return db
    .select()
    .from(agentConversations)
    .where(eq(agentConversations.userId, userId))
    .orderBy(desc(agentConversations.startedAt));
}

export async function createAgentConversation(data: {
  messageId: string;
  userId: string;
}) {
  const result = await db
    .insert(agentConversations)
    .values(data)
    .returning();
  return result[0];
}

export async function updateAgentConversation(
  conversationId: string,
  data: Partial<{
    status: string;
    outcome: string;
    resolvedAt: Date;
  }>
) {
  const result = await db
    .update(agentConversations)
    .set(data)
    .where(eq(agentConversations.id, conversationId))
    .returning();
  return result[0];
}

export async function addAgentMessage(data: {
  conversationId: string;
  role: string;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const result = await db.insert(agentMessages).values(data).returning();
  return result[0];
}

// ——— Qualification Scripts ———

export async function getQualificationScripts(userId: string) {
  return db
    .select()
    .from(qualificationScripts)
    .where(eq(qualificationScripts.userId, userId));
}

export async function getDefaultQualificationScript(userId: string) {
  const result = await db
    .select()
    .from(qualificationScripts)
    .where(
      and(
        eq(qualificationScripts.userId, userId),
        eq(qualificationScripts.isDefault, true)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function createQualificationScript(data: {
  userId: string;
  name: string;
  questions: string[];
  isDefault?: boolean;
  passThreshold?: number;
}) {
  const result = await db
    .insert(qualificationScripts)
    .values(data)
    .returning();
  return result[0];
}

export async function updateQualificationScript(
  scriptId: string,
  data: Partial<{
    name: string;
    questions: string[];
    passThreshold: number;
  }>
) {
  const result = await db
    .update(qualificationScripts)
    .set(data)
    .where(eq(qualificationScripts.id, scriptId))
    .returning();
  return result[0];
}

// ——— Agent Capabilities ———

export async function getAgentCapabilities(userId: string) {
  return db
    .select()
    .from(agentCapabilities)
    .where(eq(agentCapabilities.userId, userId));
}

export async function upsertAgentCapability(data: {
  userId: string;
  capabilityKey: string;
  isEnabled: boolean;
  config?: Record<string, unknown>;
}) {
  const existing = await db
    .select()
    .from(agentCapabilities)
    .where(
      and(
        eq(agentCapabilities.userId, data.userId),
        eq(agentCapabilities.capabilityKey, data.capabilityKey)
      )
    )
    .limit(1);

  if (existing[0]) {
    const result = await db
      .update(agentCapabilities)
      .set({ isEnabled: data.isEnabled, config: data.config })
      .where(eq(agentCapabilities.id, existing[0].id))
      .returning();
    return result[0];
  }

  const result = await db
    .insert(agentCapabilities)
    .values(data)
    .returning();
  return result[0];
}

// ——— User Preferences (composite) ———

export async function getUserPreferences(userId: string) {
  const [user, capabilities, scripts] = await Promise.all([
    getUserById(userId),
    getAgentCapabilities(userId),
    getDefaultQualificationScript(userId),
  ]);

  if (!user) return null;

  const capabilityMap: Record<string, boolean> = {};
  for (const cap of capabilities) {
    capabilityMap[cap.capabilityKey] = cap.isEnabled ?? false;
  }

  return {
    agentPosture: user.agentPosture as AgentPosture,
    capabilities: capabilityMap,
    qualificationQuestions: (scripts?.questions as string[]) || [],
  };
}

export async function updateUserPreferences(
  userId: string,
  data: Partial<{
    agentPosture: AgentPosture;
    capabilities: Record<string, boolean>;
    qualificationQuestions: string[];
  }>
) {
  if (data.agentPosture) {
    await updateUser(userId, { agentPosture: data.agentPosture });
  }

  if (data.capabilities) {
    await Promise.all(
      Object.entries(data.capabilities).map(([key, enabled]) =>
        upsertAgentCapability({
          userId,
          capabilityKey: key,
          isEnabled: enabled,
        })
      )
    );
  }

  if (data.qualificationQuestions) {
    const script = await getDefaultQualificationScript(userId);
    if (script) {
      await updateQualificationScript(script.id, {
        questions: data.qualificationQuestions,
      });
    }
  }

  return getUserPreferences(userId);
}

// ——— Webhook Events ———

export async function createWebhookEvent(data: {
  provider: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const result = await db.insert(webhookEvents).values(data).returning();
  return result[0];
}

// ——— Seed Default Data ———

export async function seedDefaultsForUser(userId: string) {
  // Default defense rules
  const defaultRules = [
    {
      userId,
      name: 'Block Template Variables',
      description:
        'Block messages containing unresolved template/merge variables',
      severity: 'hard_block' as const,
      conditions: {
        type: 'body_contains_any',
        values: ['{{', '{!', '<%=', '{%'],
      },
      isSystem: true,
    },
    {
      userId,
      name: 'Apollo/Clay Fingerprint',
      description:
        'Intercept messages with known sales tool header signatures',
      severity: 'intercept' as const,
      conditions: {
        type: 'or',
        rules: [
          {
            type: 'header_match',
            values: ['apollo', 'clay', 'outreach'],
          },
          { type: 'enrichment_signals', threshold: 60 },
        ],
      },
      isSystem: true,
    },
    {
      userId,
      name: 'AI Agent Detection',
      description: 'Intercept messages that exhibit AI generation patterns',
      severity: 'intercept' as const,
      conditions: {
        type: 'ai_patterns_score',
        threshold: 70,
      },
      isSystem: true,
    },
    {
      userId,
      name: 'Sequence Detection',
      description:
        'Block automated follow-up sequences with no prior engagement',
      severity: 'hard_block' as const,
      conditions: {
        type: 'and',
        rules: [
          { type: 'is_followup', value: true },
          { type: 'no_prior_engagement', value: true },
        ],
      },
      isSystem: true,
    },
    {
      userId,
      name: 'VIP Allowlist',
      description: 'Auto-approve messages from allowlisted senders',
      severity: 'approve' as const,
      conditions: {
        type: 'sender_in_allowlist',
      },
      isSystem: true,
    },
    {
      userId,
      name: 'Domain Reputation',
      description:
        'Intercept messages from new or low-reputation domains',
      severity: 'intercept' as const,
      conditions: {
        type: 'or',
        rules: [
          { type: 'domain_age_below', days: 90 },
          { type: 'spam_score_above', threshold: 60 },
        ],
      },
      isSystem: true,
    },
  ];

  await db.insert(defenseRules).values(defaultRules);

  // Default qualification script
  await db.insert(qualificationScripts).values({
    userId,
    name: 'Default Qualification',
    questions: [
      'What specific problem are you looking to solve for our organization?',
      'How did you learn about us and what prompted your outreach?',
      'Can you share a relevant case study from a similar company in our industry?',
      'What is your proposed timeline and budget range?',
      'Who on your team would be our primary point of contact?',
    ],
    isDefault: true,
    passThreshold: 3,
  });

  // Default agent capabilities
  const defaultCapabilities = [
    { userId, capabilityKey: 'agent_negotiation', isEnabled: false },
    { userId, capabilityKey: 'fingerprinting', isEnabled: true },
    { userId, capabilityKey: 'tool_detection', isEnabled: true },
    { userId, capabilityKey: 'cross_reference', isEnabled: false },
    { userId, capabilityKey: 'auto_unsubscribe', isEnabled: false },
    { userId, capabilityKey: 'honeypot', isEnabled: false },
  ];

  await db.insert(agentCapabilities).values(defaultCapabilities);
}
