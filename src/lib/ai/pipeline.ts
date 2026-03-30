import { classifyMessage } from './classifier';
import { detectTool, detectTemplateVariables, detectSequenceFollowup } from './tool-detector';
import {
  checkAllowlist,
  checkBlocklist,
  createInboundMessage,
  updateMessage,
  getDefenseRules,
  incrementRuleTriggerCount,
  upsertDailyStats,
  getUserById,
  getMessageByExternalId,
} from '@/lib/db/queries';
import { startAgentConversation } from './agent';
import type { ParsedEmail } from '@/lib/integrations/gmail';
import type { MessageStatus, Classification } from '@/types';

interface PipelineResult {
  messageId: string;
  status: MessageStatus;
  classification: Classification;
  threatScore: number;
  toolDetected: string | null;
  action: 'blocked' | 'intercepted' | 'approved' | 'agent_started';
}

interface RuleCondition {
  type: string;
  values?: string[];
  threshold?: number;
  value?: boolean;
  days?: number;
  rules?: RuleCondition[];
}

function evaluateCondition(
  condition: RuleCondition,
  context: {
    body: string;
    headers: Record<string, string>;
    senderEmail: string;
    senderDomain: string;
    aiResult: {
      threatScore: number;
      classification: Classification;
      fingerprints: {
        hasTemplateVars: boolean;
        hasAiPatterns: boolean;
        isSequenceFollowup: boolean;
      };
    };
    isOnAllowlist: boolean;
  }
): boolean {
  switch (condition.type) {
    case 'body_contains_any':
      return (condition.values || []).some((v) =>
        context.body.toLowerCase().includes(v.toLowerCase())
      );

    case 'header_match':
      const headerStr = Object.values(context.headers).join(' ').toLowerCase();
      return (condition.values || []).some((v) =>
        headerStr.includes(v.toLowerCase())
      );

    case 'enrichment_signals':
      return context.aiResult.threatScore >= (condition.threshold || 60);

    case 'ai_patterns_score':
      return (
        context.aiResult.fingerprints.hasAiPatterns &&
        context.aiResult.threatScore >= (condition.threshold || 70)
      );

    case 'is_followup':
      return context.aiResult.fingerprints.isSequenceFollowup;

    case 'no_prior_engagement':
      // For now, assume no prior engagement (could check conversation history)
      return true;

    case 'sender_in_allowlist':
      return context.isOnAllowlist;

    case 'domain_age_below':
      // Would need external API — skip for now
      return false;

    case 'spam_score_above':
      return context.aiResult.threatScore >= (condition.threshold || 60);

    case 'classification_is':
      return (condition.values || []).includes(context.aiResult.classification);

    case 'sender_domain_in':
      return (condition.values || []).some(
        (d) => d.toLowerCase() === context.senderDomain.toLowerCase()
      );

    case 'threat_score_above':
      return context.aiResult.threatScore >= (condition.threshold || 50);

    case 'and':
      return (condition.rules || []).every((r) =>
        evaluateCondition(r, context)
      );

    case 'or':
      return (condition.rules || []).some((r) =>
        evaluateCondition(r, context)
      );

    default:
      return false;
  }
}

export async function processInboundMessage(
  userId: string,
  email: ParsedEmail
): Promise<PipelineResult> {
  // Check if we already processed this message
  const existing = await getMessageByExternalId(userId, email.messageId);
  if (existing) {
    return {
      messageId: existing.id,
      status: (existing.status ?? 'pending') as MessageStatus,
      classification: (existing.classification ?? 'unknown') as Classification,
      threatScore: existing.threatScore ?? 0,
      toolDetected: existing.toolDetected ?? null,
      action: existing.status === 'blocked' ? 'blocked' : 'approved',
    };
  }

  const senderDomain = email.from.split('@')[1] || '';

  // 1. Create initial message record
  const message = await createInboundMessage({
    userId,
    externalMessageId: email.messageId,
    channel: 'email',
    senderEmail: email.from,
    senderName: email.fromName ?? undefined,
    senderDomain,
    subject: email.subject,
    bodyPreview: email.bodyPreview,
    bodyFull: email.body,
    status: 'pending',
    receivedAt: email.receivedAt,
  });

  // 2. Check allowlist
  const isOnAllowlist = await checkAllowlist(userId, email.from);
  if (isOnAllowlist) {
    await updateMessage(message.id, {
      status: 'approved',
      classification: 'legitimate',
      threatScore: 0,
      processedAt: new Date(),
      matchedRules: ['allowlist_match'],
    });
    await upsertDailyStats(userId, new Date(), { approved: 1 });
    return {
      messageId: message.id,
      status: 'approved',
      classification: 'legitimate',
      threatScore: 0,
      toolDetected: null,
      action: 'approved',
    };
  }

  // 3. Check blocklist
  const isOnBlocklist = await checkBlocklist(userId, email.from);
  if (isOnBlocklist) {
    await updateMessage(message.id, {
      status: 'blocked',
      classification: 'spam',
      threatScore: 100,
      processedAt: new Date(),
      matchedRules: ['blocklist_match'],
    });
    await upsertDailyStats(userId, new Date(), { blocked: 1 });
    return {
      messageId: message.id,
      status: 'blocked',
      classification: 'spam',
      threatScore: 100,
      toolDetected: null,
      action: 'blocked',
    };
  }

  // 4. Run tool detection
  const toolResult = detectTool(email.body, email.headers);

  // 5. Run AI classification
  const aiResult = await classifyMessage(
    email.subject,
    email.body,
    email.from,
    email.fromName,
    email.headers
  );

  // Merge tool detection: prefer header-based detection, fall back to AI
  const finalToolDetected =
    toolResult.toolDetected || aiResult.toolDetected;
  const finalToolConfidence = toolResult.toolDetected
    ? toolResult.toolConfidence
    : aiResult.toolConfidence;

  // 6. Run defense rules
  const rules = await getDefenseRules(userId);
  const matchedRuleIds: string[] = [];
  let ruleAction: MessageStatus = 'approved';
  const severityPriority: Record<string, number> = {
    hard_block: 4,
    intercept: 3,
    qualify: 2,
    delay: 1,
    approve: 0,
  };
  let highestPriority = -1;

  for (const rule of rules) {
    if (!rule.isEnabled) continue;

    const condition = rule.conditions as RuleCondition;
    const context = {
      body: email.body,
      headers: email.headers,
      senderEmail: email.from,
      senderDomain,
      aiResult: {
        threatScore: aiResult.threatScore,
        classification: aiResult.classification,
        fingerprints: aiResult.fingerprints,
      },
      isOnAllowlist,
    };

    if (evaluateCondition(condition, context)) {
      matchedRuleIds.push(rule.id);
      const priority = severityPriority[rule.severity] ?? 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        switch (rule.severity) {
          case 'hard_block':
            ruleAction = 'blocked';
            break;
          case 'intercept':
          case 'qualify':
            ruleAction = 'intercepted';
            break;
          case 'delay':
            ruleAction = 'intercepted';
            break;
          case 'approve':
            ruleAction = 'approved';
            break;
        }
      }
    }
  }

  // Increment triggered counts
  if (matchedRuleIds.length > 0) {
    await incrementRuleTriggerCount(matchedRuleIds);
  }

  // 7. Compute final threat score (combine rule matches + AI score)
  let finalThreatScore = aiResult.threatScore;
  if (detectTemplateVariables(email.body)) finalThreatScore = Math.max(finalThreatScore, 90);
  if (detectSequenceFollowup(email.subject, email.body))
    finalThreatScore = Math.min(finalThreatScore + 15, 100);

  // 8. Determine final status
  let finalStatus: MessageStatus;
  if (ruleAction === 'blocked' || finalThreatScore >= 85) {
    finalStatus = 'blocked';
  } else if (
    ruleAction === 'intercepted' ||
    aiResult.suggestedAction === 'intercept' ||
    aiResult.suggestedAction === 'qualify'
  ) {
    finalStatus = 'intercepted';
  } else {
    finalStatus = 'approved';
  }

  // 9. Update message with full analysis
  await updateMessage(message.id, {
    threatScore: finalThreatScore,
    classification: aiResult.classification,
    toolDetected: finalToolDetected,
    toolConfidence: finalToolConfidence,
    status: finalStatus,
    aiAnalysis: aiResult as unknown as Record<string, unknown>,
    matchedRules: matchedRuleIds,
    processedAt: new Date(),
  });

  // 10. Update daily stats
  const statIncrement: {
    blocked?: number;
    intercepted?: number;
    approved?: number;
    toolDetected?: string;
  } = {};
  if (finalStatus === 'blocked') statIncrement.blocked = 1;
  else if (finalStatus === 'intercepted') statIncrement.intercepted = 1;
  else statIncrement.approved = 1;
  if (finalToolDetected) statIncrement.toolDetected = finalToolDetected;
  await upsertDailyStats(userId, new Date(), statIncrement);

  // 11. Start agent conversation if intercepted
  let action: PipelineResult['action'] =
    finalStatus === 'blocked'
      ? 'blocked'
      : finalStatus === 'intercepted'
        ? 'intercepted'
        : 'approved';

  if (finalStatus === 'intercepted') {
    const user = await getUserById(userId);
    if (user && user.agentPosture !== 'passive') {
      try {
        await startAgentConversation(userId, message.id, email);
        await updateMessage(message.id, { status: 'agent_handling' });
        action = 'agent_started';
      } catch {
        // Agent failed to start — keep as intercepted
      }
    }
  }

  return {
    messageId: message.id,
    status: finalStatus,
    classification: aiResult.classification,
    threatScore: finalThreatScore,
    toolDetected: finalToolDetected,
    action,
  };
}
