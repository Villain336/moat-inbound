import { generateAgentResponse } from './classifier';
import {
  createAgentConversation,
  addAgentMessage,
  getAgentConversationById,
  getDefaultQualificationScript,
  getUserById,
  updateAgentConversation,
  updateMessageStatus,
  upsertDailyStats,
} from '@/lib/db/queries';
import { sendReply } from '@/lib/integrations/gmail';
import type { ParsedEmail } from '@/lib/integrations/gmail';
import type { AgentPosture } from '@/types';

export async function startAgentConversation(
  userId: string,
  messageId: string,
  email: ParsedEmail
) {
  const [user, script] = await Promise.all([
    getUserById(userId),
    getDefaultQualificationScript(userId),
  ]);

  if (!user) throw new Error('User not found');

  const posture = (user.agentPosture as AgentPosture) || 'defensive';
  if (posture === 'passive') return null;

  const questions = (script?.questions as string[]) || [
    'What specific problem are you looking to solve?',
    'How did you learn about us?',
    'Can you share a relevant case study?',
  ];

  // Create conversation record
  const conversation = await createAgentConversation({
    messageId,
    userId,
  });

  // Record inbound message
  await addAgentMessage({
    conversationId: conversation.id,
    role: 'inbound_agent',
    content: `Subject: ${email.subject}\n\n${email.body}`,
  });

  // Generate agent response
  const conversationHistory = [
    { role: 'inbound_agent', content: `Subject: ${email.subject}\n\n${email.body}` },
  ];

  const agentReply = await generateAgentResponse(
    conversationHistory,
    questions,
    posture
  );

  // Record agent response
  await addAgentMessage({
    conversationId: conversation.id,
    role: 'moat_agent',
    content: agentReply,
  });

  // Send the reply via Gmail
  try {
    await sendReply(
      userId,
      email.threadId,
      email.from,
      email.subject,
      agentReply
    );
  } catch (error) {
    console.error('Failed to send agent reply via Gmail:', error);
    // Still keep the conversation — user can see what would have been sent
  }

  // Update stats
  await upsertDailyStats(userId, new Date(), { agentConversations: 1 });

  return conversation;
}

export async function handleAgentReply(
  userId: string,
  conversationId: string,
  inboundContent: string,
  email: ParsedEmail
) {
  const [conversation, user, script] = await Promise.all([
    getAgentConversationById(conversationId),
    getUserById(userId),
    getDefaultQualificationScript(userId),
  ]);

  if (!conversation || !user) {
    throw new Error('Conversation or user not found');
  }

  if (conversation.status !== 'active') {
    return { status: conversation.status, outcome: conversation.outcome };
  }

  const posture = (user.agentPosture as AgentPosture) || 'defensive';
  const questions = (script?.questions as string[]) || [];

  // Record inbound reply
  await addAgentMessage({
    conversationId,
    role: 'inbound_agent',
    content: inboundContent,
  });

  // Build conversation history
  const history = conversation.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  history.push({ role: 'inbound_agent', content: inboundContent });

  // Check if we should resolve the conversation
  const inboundMessageCount = history.filter(
    (m) => m.role === 'inbound_agent'
  ).length;

  // After enough exchanges, evaluate qualification
  if (inboundMessageCount >= (script?.passThreshold || 3)) {
    const outcome = await evaluateQualification(history, questions);

    await updateAgentConversation(conversationId, {
      status: 'resolved',
      outcome,
      resolvedAt: new Date(),
    });

    if (outcome === 'qualified') {
      await updateMessageStatus(conversation.messageId, 'approved');
    } else {
      await updateMessageStatus(conversation.messageId, 'blocked');
    }

    // Send final message
    const finalReply =
      outcome === 'qualified'
        ? "Thank you for taking the time to share those details. I'll make sure this reaches the right person on our team. Expect to hear back shortly."
        : "Thank you for your time. Based on our conversation, this doesn't seem like the right fit at this time. We'll keep your information on file.";

    await addAgentMessage({
      conversationId,
      role: 'moat_agent',
      content: finalReply,
    });

    try {
      await sendReply(userId, email.threadId, email.from, email.subject, finalReply);
    } catch {
      // Non-critical
    }

    return { status: 'resolved', outcome };
  }

  // Generate next agent response
  const agentReply = await generateAgentResponse(history, questions, posture);

  await addAgentMessage({
    conversationId,
    role: 'moat_agent',
    content: agentReply,
  });

  try {
    await sendReply(userId, email.threadId, email.from, email.subject, agentReply);
  } catch (error) {
    console.error('Failed to send agent reply:', error);
  }

  return { status: 'active', outcome: null };
}

export async function userOverrideReply(
  userId: string,
  conversationId: string,
  content: string
) {
  const conversation = await getAgentConversationById(conversationId);
  if (!conversation) throw new Error('Conversation not found');

  await addAgentMessage({
    conversationId,
    role: 'user_override',
    content,
  });

  return getAgentConversationById(conversationId);
}

async function evaluateQualification(
  history: Array<{ role: string; content: string }>,
  questions: string[]
): Promise<string> {
  // Simple heuristic: if the sender provided substantive answers
  // (not one-liners or deflections), consider them qualified
  const inboundReplies = history
    .filter((m) => m.role === 'inbound_agent')
    .slice(1); // Skip initial outreach

  if (inboundReplies.length === 0) return 'disqualified';

  const avgLength =
    inboundReplies.reduce((sum, m) => sum + m.content.length, 0) /
    inboundReplies.length;

  // Short, generic replies suggest automated/unqualified sender
  if (avgLength < 50) return 'disqualified';

  // If they answered most questions substantively
  if (avgLength > 200 && inboundReplies.length >= 2) return 'qualified';

  return 'escalated_to_user';
}
