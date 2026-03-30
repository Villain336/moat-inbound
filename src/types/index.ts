export type MessageStatus =
  | 'pending'
  | 'blocked'
  | 'intercepted'
  | 'agent_handling'
  | 'approved'
  | 'quarantined';

export type Channel = 'email' | 'linkedin' | 'twitter' | 'sms' | 'phone' | 'other';

export type Classification =
  | 'spam'
  | 'automated_outreach'
  | 'automated_sequence'
  | 'ai_agent_outreach'
  | 'enrichment_outreach'
  | 'qualified_lead'
  | 'legitimate'
  | 'unknown';

export type RuleSeverity =
  | 'hard_block'
  | 'intercept'
  | 'qualify'
  | 'delay'
  | 'approve';

export type AgentPosture = 'passive' | 'defensive' | 'aggressive';

export interface InboundMessage {
  id: string;
  userId: string;
  channel: Channel;
  senderEmail: string | null;
  senderName: string | null;
  senderCompany: string | null;
  senderDomain: string | null;
  subject: string | null;
  bodyPreview: string | null;
  threatScore: number;
  classification: Classification;
  toolDetected: string | null;
  toolConfidence: number | null;
  status: MessageStatus;
  aiAnalysis: Record<string, unknown> | null;
  matchedRules: string[] | null;
  receivedAt: string;
  processedAt: string | null;
}

export interface DefenseRule {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  severity: RuleSeverity;
  conditions: Record<string, unknown>;
  isEnabled: boolean;
  isSystem: boolean;
  timesTriggered: number;
}

export interface AgentConversation {
  id: string;
  messageId: string;
  status: 'active' | 'resolved' | 'escalated';
  outcome: string | null;
  messages: AgentMessage[];
}

export interface AgentMessage {
  id: string;
  role: 'moat_agent' | 'inbound_agent' | 'user_override';
  content: string;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  blocked: number;
  intercepted: number;
  approved: number;
  agentConversations: number;
  toolsDetected: Record<string, number>;
}

export interface UserPreferences {
  agentPosture: AgentPosture;
  capabilities: Record<string, boolean>;
  qualificationQuestions: string[];
}
