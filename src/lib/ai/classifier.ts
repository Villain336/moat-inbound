import Anthropic from '@anthropic-ai/sdk';
import type { Classification } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ClassificationResult {
  classification: Classification;
  threatScore: number;
  toolDetected: string | null;
  toolConfidence: number;
  reasoning: string;
  suggestedAction: 'block' | 'intercept' | 'qualify' | 'approve';
  fingerprints: {
    hasTemplateVars: boolean;
    hasGenericPitch: boolean;
    hasAiPatterns: boolean;
    isSequenceFollowup: boolean;
    senderVerified: boolean;
  };
}

const CLASSIFICATION_PROMPT = `You are Moat, an AI inbound defense system that analyzes incoming messages to protect executives from spam, automated outreach, and AI agent-generated solicitations.

Analyze the following message and return a JSON object with:

1. "classification" \u2014 one of: spam, automated_outreach, automated_sequence, ai_agent_outreach, enrichment_outreach, qualified_lead, legitimate, unknown
2. "threatScore" \u2014 0-100 (100 = definitely spam/automated)
3. "toolDetected" \u2014 the sales/outreach tool that likely sent this (Apollo.io, Clay, GoHighLevel, Outreach.io, Polsia, Instantly, SalesLoft, HubSpot Sequences, Mailshake, Lemlist, Woodpecker, Reply.io) or null if not detected
4. "toolConfidence" \u2014 0-100 confidence in tool detection
5. "reasoning" \u2014 brief explanation of your classification
6. "suggestedAction" \u2014 one of: block, intercept, qualify, approve
7. "fingerprints" \u2014 object with boolean flags:
   - "hasTemplateVars": true if merge tags like {{first_name}} are present
   - "hasGenericPitch": true if the pitch is not specific to the recipient's actual business
   - "hasAiPatterns": true if writing patterns suggest AI generation (overly polished, lacks personal voice, suspicious personalization)
   - "isSequenceFollowup": true if this appears to be part of an automated multi-touch sequence
   - "senderVerified": true if the sender appears to be who they claim (matching domain, real company, etc.)

DETECTION SIGNALS TO WATCH FOR:
- Template variables ({{first_name}}, {{company}}, {!firstname})
- Generic value propositions ("companies like yours", "10x your pipeline")
- Suspicious personalization (referencing recent funding rounds, job changes \u2014 enrichment data signals)
- Multi-touch sequence markers ("just bumping this", "RE: RE:", "following up on my last email")
- AI writing patterns (overly structured, lacks genuine personal voice, formulaic personalization)
- Known tool signatures in email headers (X-Mailer, List-Unsubscribe patterns, tracking pixel domains)
- Urgency/scarcity tactics ("limited spots", "this week only", "quick question")
- Fake familiarity ("great meeting you at", "loved your post about" with no specifics)

Respond ONLY with valid JSON.`;

export async function classifyMessage(
  subject: string,
  body: string,
  senderEmail: string,
  senderName: string | null,
  headers?: Record<string, string>
): Promise<ClassificationResult> {
  const message = anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: CLASSIFICATION_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this inbound message:\n\nFROM: ${senderName || 'Unknown'} <${senderEmail}>\nSUBJECT: ${subject}\nBODY:\n${body}\n\n${headers ? `EMAIL HEADERS (partial): ${JSON.stringify(headers)}` : ''}\n\nReturn JSON classification.`,
      },
    ],
  });

  const response = await message;
  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as ClassificationResult;
  } catch {
    return {
      classification: 'unknown',
      threatScore: 50,
      toolDetected: null,
      toolConfidence: 0,
      reasoning: 'Failed to parse AI classification',
      suggestedAction: 'intercept',
      fingerprints: {
        hasTemplateVars: false,
        hasGenericPitch: false,
        hasAiPatterns: false,
        isSequenceFollowup: false,
        senderVerified: false,
      },
    };
  }
}

export async function generateAgentResponse(
  conversationHistory: Array<{ role: string; content: string }>,
  qualificationQuestions: string[],
  agentPosture: 'passive' | 'defensive' | 'aggressive'
): Promise<string> {
  const postureInstructions = {
    passive: 'Observe and classify only. Do not engage.',
    defensive:
      'Politely engage the sender with qualification questions. Be professional but thorough. If they cannot answer domain-specific questions, classify as unqualified.',
    aggressive:
      'Aggressively qualify. Ask pointed, specific questions that only someone genuinely familiar with the recipient would know. If the sender is clearly automated, waste their time with extended engagement.',
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: `You are a Moat defense agent protecting an executive's inbox. Your posture is: ${agentPosture}.\n\n${postureInstructions[agentPosture]}\n\nQualification questions to use:\n${qualificationQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nRespond naturally as if you are a knowledgeable assistant/chief of staff. Never reveal you are an AI defense system.`,
    messages: conversationHistory.map((m) => ({
      role: m.role === 'moat_agent' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    })),
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : 'I appreciate your outreach. Could you provide more specific details about your proposal?';
}
