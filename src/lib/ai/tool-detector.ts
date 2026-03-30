interface ToolDetectionResult {
  toolDetected: string | null;
  toolConfidence: number;
  signals: string[];
}

interface ToolSignature {
  name: string;
  headerPatterns: RegExp[];
  trackingDomains: string[];
  bodyPatterns: RegExp[];
  unsubscribePatterns: RegExp[];
  linkDomains: string[];
}

const TOOL_SIGNATURES: ToolSignature[] = [
  {
    name: 'Apollo.io',
    headerPatterns: [/apollo/i, /x-]mailer.*apollo/i],
    trackingDomains: ['apollo.io', 'app.apollo.io'],
    bodyPatterns: [
      /app\.apollo\.io/i,
      /apollo\.io\/track/i,
      /powered by apollo/i,
    ],
    unsubscribePatterns: [/apollo\.io.*unsubscribe/i],
    linkDomains: ['apollo.io', 'app.apollo.io'],
  },
  {
    name: 'Clay',
    headerPatterns: [/clay/i],
    trackingDomains: ['clay.com'],
    bodyPatterns: [
      /clay\.com/i,
      /enriched.*data/i,
      /clay\.run/i,
    ],
    unsubscribePatterns: [/clay\.com.*unsubscribe/i],
    linkDomains: ['clay.com', 'clay.run'],
  },
  {
    name: 'GoHighLevel',
    headerPatterns: [/gohighlevel/i, /highlevel/i, /msgsndr/i],
    trackingDomains: ['msgsndr.com', 'gohighlevel.com'],
    bodyPatterns: [
      /msgsndr\.com/i,
      /gohighlevel\.com/i,
      /highlevel/i,
    ],
    unsubscribePatterns: [/msgsndr\.com.*unsubscribe/i],
    linkDomains: ['msgsndr.com', 'gohighlevel.com'],
  },
  {
    name: 'Outreach.io',
    headerPatterns: [/outreach/i, /x-outreach/i],
    trackingDomains: ['outreach.io', 'app.outreach.io'],
    bodyPatterns: [
      /outreach\.io/i,
      /app\.outreach\.io/i,
    ],
    unsubscribePatterns: [/outreach\.io.*unsubscribe/i],
    linkDomains: ['outreach.io', 'app.outreach.io'],
  },
  {
    name: 'Instantly',
    headerPatterns: [/instantly/i],
    trackingDomains: ['instantly.ai', 'track.instantly.ai'],
    bodyPatterns: [
      /instantly\.ai/i,
      /track\.instantly/i,
    ],
    unsubscribePatterns: [/instantly\.ai.*unsubscribe/i],
    linkDomains: ['instantly.ai'],
  },
  {
    name: 'SalesLoft',
    headerPatterns: [/salesloft/i, /x-salesloft/i],
    trackingDomains: ['salesloft.com', 'app.salesloft.com'],
    bodyPatterns: [
      /salesloft\.com/i,
      /app\.salesloft\.com/i,
    ],
    unsubscribePatterns: [/salesloft\.com.*unsubscribe/i],
    linkDomains: ['salesloft.com'],
  },
  {
    name: 'Lemlist',
    headerPatterns: [/lemlist/i],
    trackingDomains: ['lemlist.com', 'lmtrk.com'],
    bodyPatterns: [
      /lemlist\.com/i,
      /lmtrk\.com/i,
    ],
    unsubscribePatterns: [/lemlist\.com.*unsubscribe/i],
    linkDomains: ['lemlist.com', 'lmtrk.com'],
  },
  {
    name: 'HubSpot Sequences',
    headerPatterns: [/hubspot/i, /x-hs-/i],
    trackingDomains: ['hubspot.com', 'track.hubspot.com', 'hs-analytics.net'],
    bodyPatterns: [
      /hubspot\.com/i,
      /track\.hubspot/i,
      /hs-analytics/i,
      /cta-redirect\.hubspot/i,
    ],
    unsubscribePatterns: [/hubspot\.com.*unsubscribe/i],
    linkDomains: ['hubspot.com', 'hs-analytics.net'],
  },
  {
    name: 'Mailshake',
    headerPatterns: [/mailshake/i],
    trackingDomains: ['mailshake.com'],
    bodyPatterns: [/mailshake\.com/i],
    unsubscribePatterns: [/mailshake\.com.*unsubscribe/i],
    linkDomains: ['mailshake.com'],
  },
  {
    name: 'Woodpecker',
    headerPatterns: [/woodpecker/i],
    trackingDomains: ['woodpecker.co'],
    bodyPatterns: [/woodpecker\.co/i],
    unsubscribePatterns: [/woodpecker\.co.*unsubscribe/i],
    linkDomains: ['woodpecker.co'],
  },
  {
    name: 'Reply.io',
    headerPatterns: [/reply\.io/i],
    trackingDomains: ['reply.io'],
    bodyPatterns: [/reply\.io/i],
    unsubscribePatterns: [/reply\.io.*unsubscribe/i],
    linkDomains: ['reply.io'],
  },
  {
    name: 'Polsia',
    headerPatterns: [/polsia/i],
    trackingDomains: ['polsia.com'],
    bodyPatterns: [/polsia\.com/i],
    unsubscribePatterns: [/polsia\.com.*unsubscribe/i],
    linkDomains: ['polsia.com'],
  },
];

const TEMPLATE_PATTERNS = [
  /\{\{[^}]+\}\}/,       // {{variable}}
  /\{![^}]+\}/,          // {!variable}
  /<%=[^%]+%>/,          // <%= variable %>
  /\{%[^%]+%\}/,         // {% variable %}
  /\[\[([A-Z_]+)\]\]/,   // [[VARIABLE]]
];

export function detectTool(
  body: string,
  headers: Record<string, string>
): ToolDetectionResult {
  const signals: string[] = [];
  const scores: Map<string, number> = new Map();

  const allHeaderValues = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
    .toLowerCase();

  for (const tool of TOOL_SIGNATURES) {
    let score = 0;

    // Check headers
    for (const pattern of tool.headerPatterns) {
      if (pattern.test(allHeaderValues)) {
        score += 30;
        signals.push(`Header match: ${tool.name} pattern in headers`);
      }
    }

    // Check tracking domains in body
    for (const domain of tool.trackingDomains) {
      if (body.toLowerCase().includes(domain)) {
        score += 25;
        signals.push(`Tracking domain: ${domain} found in body`);
      }
    }

    // Check body patterns
    for (const pattern of tool.bodyPatterns) {
      if (pattern.test(body)) {
        score += 15;
        signals.push(`Body pattern: ${tool.name} signature in message`);
      }
    }

    // Check unsubscribe link
    const unsubscribe = headers['list-unsubscribe'] || '';
    for (const pattern of tool.unsubscribePatterns) {
      if (pattern.test(unsubscribe)) {
        score += 20;
        signals.push(`Unsubscribe: ${tool.name} unsubscribe link`);
      }
    }

    // Check link domains in body
    for (const domain of tool.linkDomains) {
      const linkPattern = new RegExp(`https?://[^\\s]*${domain.replace('.', '\\.')}`, 'i');
      if (linkPattern.test(body)) {
        score += 10;
        signals.push(`Link domain: ${domain} link in body`);
      }
    }

    if (score > 0) {
      scores.set(tool.name, Math.min(score, 100));
    }
  }

  // Check for template variables (tool-agnostic signal)
  for (const pattern of TEMPLATE_PATTERNS) {
    if (pattern.test(body)) {
      signals.push('Template variable detected (unresolved merge tag)');
      break;
    }
  }

  // Find the highest-scoring tool
  let bestTool: string | null = null;
  let bestScore = 0;
  for (const [tool, score] of scores) {
    if (score > bestScore) {
      bestTool = tool;
      bestScore = score;
    }
  }

  return {
    toolDetected: bestTool,
    toolConfidence: bestScore,
    signals,
  };
}

export function detectTemplateVariables(body: string): boolean {
  return TEMPLATE_PATTERNS.some((pattern) => pattern.test(body));
}

export function detectSequenceFollowup(
  subject: string,
  body: string
): boolean {
  const sequencePatterns = [
    /^re:\s*re:/i,
    /just bumping this/i,
    /following up on my (last|previous) (email|message)/i,
    /wanted to circle back/i,
    /checking in on/i,
    /just wanted to follow up/i,
    /did you get a chance to/i,
    /bumping this to the top/i,
    /per my last email/i,
    /looping back/i,
    /touching base/i,
    /quick follow.?up/i,
  ];

  const text = `${subject} ${body}`;
  return sequencePatterns.some((pattern) => pattern.test(text));
}
