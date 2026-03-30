import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ——— Enums ———

export const messageStatusEnum = pgEnum('message_status', [
  'pending',
  'blocked',
  'intercepted',
  'agent_handling',
  'approved',
  'quarantined',
]);

export const channelEnum = pgEnum('channel', [
  'email',
  'linkedin',
  'twitter',
  'sms',
  'phone',
  'other',
]);

export const classificationEnum = pgEnum('classification', [
  'spam',
  'automated_outreach',
  'automated_sequence',
  'ai_agent_outreach',
  'enrichment_outreach',
  'qualified_lead',
  'legitimate',
  'unknown',
]);

export const ruleSeverityEnum = pgEnum('rule_severity', [
  'hard_block',
  'intercept',
  'qualify',
  'delay',
  'approve',
]);

export const agentPostureEnum = pgEnum('agent_posture', [
  'passive',
  'defensive',
  'aggressive',
]);

// ——— Users & Auth ———

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  plan: text('plan').default('free'), // free, pro, enterprise
  agentPosture: agentPostureEnum('agent_posture').default('defensive'),
  onboardingComplete: boolean('onboarding_complete').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ——— Connected Accounts (Gmail, Outlook, LinkedIn) ———

export const connectedAccounts = pgTable('connected_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(), // gmail, outlook, linkedin
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ——— Inbound Messages ———

export const inboundMessages = pgTable('inbound_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  externalMessageId: text('external_message_id'), // Gmail/Outlook message ID
  channel: channelEnum('channel').notNull(),
  senderEmail: text('sender_email'),
  senderName: text('sender_name'),
  senderCompany: text('sender_company'),
  senderDomain: text('sender_domain'),
  subject: text('subject'),
  bodyPreview: text('body_preview'),
  bodyFull: text('body_full'),
  threatScore: integer('threat_score').default(0), // 0-100
  classification: classificationEnum('classification').default('unknown'),
  toolDetected: text('tool_detected'), // Apollo, Clay, GHL, etc.
  toolConfidence: integer('tool_confidence'), // 0-100
  status: messageStatusEnum('status').default('pending'),
  aiAnalysis: jsonb('ai_analysis'), // Full Claude analysis JSON
  matchedRules: jsonb('matched_rules'), // Array of rule IDs that fired
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ——— Agent Conversations ———

export const agentConversations = pgTable('agent_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => inboundMessages.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('active'), // active, resolved, escalated
  outcome: text('outcome'), // qualified, disqualified, escalated_to_user
  startedAt: timestamp('started_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const agentMessages = pgTable('agent_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => agentConversations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // moat_agent, inbound_agent, user_override
  content: text('content').notNull(),
  metadata: jsonb('metadata'), // tool calls, analysis, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ——— Defense Rules ———

export const defenseRules = pgTable('defense_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  severity: ruleSeverityEnum('severity').notNull(),
  conditions: jsonb('conditions').notNull(), // Rule conditions as JSON
  isEnabled: boolean('is_enabled').default(true),
  isSystem: boolean('is_system').default(false), // System rules can't be deleted
  timesTriggered: integer('times_triggered').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ——— Allow / Block Lists ———

export const allowlist = pgTable('allowlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  entry: text('entry').notNull(), // domain or email
  entryType: text('entry_type').notNull(), // domain, email, company
  notes: text('notes'),
  addedBy: text('added_by').default('manual'), // manual, agent_suggestion, auto
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const blocklist = pgTable('blocklist', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  entry: text('entry').notNull(),
  entryType: text('entry_type').notNull(), // domain, email, tool_signature
  reason: text('reason'),
  addedBy: text('added_by').default('manual'), // manual, auto_block, agent
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ——— Qualification Scripts ———

export const qualificationScripts = pgTable('qualification_scripts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  questions: jsonb('questions').notNull(), // Array of question strings
  isDefault: boolean('is_default').default(false),
  passThreshold: integer('pass_threshold').default(3), // Questions correctly answered to pass
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ——— Agent Capabilities (toggles per user) ———

export const agentCapabilities = pgTable('agent_capabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  capabilityKey: text('capability_key').notNull(), // agent_negotiation, fingerprinting, etc.
  isEnabled: boolean('is_enabled').default(false),
  config: jsonb('config'), // Capability-specific settings
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ——— Analytics / Stats ———

export const dailyStats = pgTable('daily_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  blocked: integer('blocked').default(0),
  intercepted: integer('intercepted').default(0),
  approved: integer('approved').default(0),
  agentConversations: integer('agent_conversations').default(0),
  toolsDetected: jsonb('tools_detected'), // { tool_name: count }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ——— Webhook Events (for email provider webhooks) ———

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: text('provider').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
