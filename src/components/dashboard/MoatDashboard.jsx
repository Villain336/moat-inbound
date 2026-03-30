import { useState, useEffect, useCallback, useRef } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700;800&display=swap');
`;

// — Simulated Data —
const INBOUND_MESSAGES = [
  { id: 1, sender: "Kyle Branson", company: "ScaleAI Solutions", channel: "email", subject: "Quick question about your infrastructure needs", preview: "Hi, I noticed your company recently raised a Series B. We help companies like yours scale their AI infrastructure by 10x. Would love to grab 15 minutes...", timestamp: "2m ago", threat_score: 92, classification: "automated_outreach", tool_detected: "Apollo.io", status: "intercepted", agent_response: "Responded with qualification questions. Sender failed to provide specific context about our actual tech stack — confirmed automated sequence." },
  { id: 2, sender: "Maria Chen", company: "Andreessen Horowitz", channel: "linkedin", subject: "Following up on the Founder Summit", preview: "Great meeting you at the event last week. I'd love to continue our conversation about the defense-tech thesis you mentioned...", timestamp: "14m ago", threat_score: 8, classification: "legitimate", tool_detected: null, status: "approved", agent_response: null },
  { id: 3, sender: "James Whitfield", company: "LeadGen Pro", channel: "email", subject: "We guarantee 50 meetings/month", preview: "Hey {{first_name}}, I saw you're in the {{industry}} space. Our clients see 3-5x ROI within 30 days using our proprietary outreach system...", timestamp: "28m ago", threat_score: 99, classification: "spam", tool_detected: "GoHighLevel", status: "blocked", agent_response: "Template variables detected ({{first_name}}, {{industry}}). Auto-blocked. Sender domain added to permanent block list." },
  { id: 4, sender: "Rachel Torres", company: "Meridian Capital", channel: "email", subject: "Co-investment opportunity — Series A in robotics", preview: "Our fund is leading a $12M Series A in a robotics company out of CMU. Given your portfolio focus, thought this might align. Happy to share the deck...", timestamp: "1h ago", threat_score: 22, classification: "qualified_lead", tool_detected: null, status: "agent_handling", agent_response: "Verified sender identity via LinkedIn cross-reference. Requested deck and term sheet. Flagged for your review with context summary." },
  { id: 5, sender: "David Kim", company: "Polsia", channel: "linkedin", subject: "Personalized outreach about your AI stack", preview: "I used AI to research your company and I think our product could save you 40 hours/week. The analysis shows that your current workflow...", timestamp: "1h ago", threat_score: 85, classification: "ai_agent_outreach", tool_detected: "Polsia", status: "intercepted", agent_response: "AI-generated outreach detected (linguistic fingerprint match). Moat agent engaged the sender's agent in qualification loop. Sender's agent could not answer domain-specific questions — disqualified." },
  { id: 6, sender: "Tom Ashford", company: "Clay + Instantly", channel: "email", subject: "Saw your post about scaling — thoughts?", preview: "I was reading your LinkedIn post about building in public and thought our data enrichment platform could help you identify better prospects...", timestamp: "2h ago", threat_score: 78, classification: "enrichment_outreach", tool_detected: "Clay", status: "intercepted", agent_response: "Detected Clay enrichment fingerprint + Instantly sending infrastructure. Sender put in 72-hour cooling queue with auto-response." },
  { id: 7, sender: "Samira Patel", company: "Google DeepMind", channel: "email", subject: "Research collaboration proposal", preview: "Our team is exploring applications of foundation models in industrial automation. Your work on printing technology caught our attention...", timestamp: "3h ago", threat_score: 5, classification: "legitimate", tool_detected: null, status: "approved", agent_response: null },
  { id: 8, sender: "BDR Team", company: "SaaSify", channel: "email", subject: "RE: RE: RE: Following up", preview: "Just bumping this to the top of your inbox! I know you're busy but I truly believe we can help you...", timestamp: "4h ago", threat_score: 95, classification: "automated_sequence", tool_detected: "Outreach.io", status: "blocked", agent_response: "Multi-touch sequence detected (3rd follow-up with no prior engagement). Entire sequence domain blocked. Unsubscribe triggered automatically." },
];

const DEFENSE_RULES = [
  { id: 1, name: "Block Template Variables", description: "Auto-block any message containing merge tags like {{first_name}}", enabled: true, severity: "hard_block" },
  { id: 2, name: "Apollo/Clay Fingerprint", description: "Detect and intercept outreach from known enrichment platforms", enabled: true, severity: "intercept" },
  { id: 3, name: "AI Agent Detection", description: "Identify AI-generated outreach via linguistic analysis", enabled: true, severity: "intercept" },
  { id: 4, name: "VIP Allowlist", description: "Always approve messages from verified contacts and domains", enabled: true, severity: "approve" },
  { id: 5, name: "Sequence Detection", description: "Block multi-touch automated sequences after 2nd unanswered touch", enabled: true, severity: "hard_block" },
  { id: 6, name: "Domain Reputation", description: "Score sender domains against known spam infrastructure", enabled: true, severity: "intercept" },
  { id: 7, name: "Investment Opportunity Filter", description: "Route qualified investment/deal flow to review queue", enabled: true, severity: "qualify" },
  { id: 8, name: "Cooling Queue", description: "Hold suspicious but not confirmed spam for 72hrs before delivery", enabled: false, severity: "delay" },
];

const STATS = {
  blocked_today: 47, intercepted_today: 23, approved_today: 12, agent_conversations: 8,
  tools_detected: { "Apollo.io": 14, "Clay": 9, "GoHighLevel": 8, "Outreach.io": 7, "Polsia": 5, "Instantly": 4 },
  weekly_trend: [
    { day: "Mon", blocked: 38, intercepted: 19, approved: 14 },
    { day: "Tue", blocked: 42, intercepted: 22, approved: 11 },
    { day: "Wed", blocked: 51, intercepted: 28, approved: 9 },
    { day: "Thu", blocked: 44, intercepted: 21, approved: 13 },
    { day: "Fri", blocked: 39, intercepted: 17, approved: 15 },
    { day: "Sat", blocked: 12, intercepted: 5, approved: 3 },
    { day: "Sun", blocked: 47, intercepted: 23, approved: 12 },
  ],
};

// Design reference prototype — see production components for real implementation
export default function MoatDashboard() {
  return <div style={{ color: "#fff", padding: 40, fontFamily: "'Outfit', sans-serif" }}>
    <h1>MoatDashboard Prototype</h1>
    <p style={{ color: "rgba(255,255,255,0.5)" }}>This is the design reference file. See production components in src/components/dashboard/ for the real implementation.</p>
  </div>;
}
