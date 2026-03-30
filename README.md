# MOAT — AI Inbound Defense System

> Your AI chief of staff that intercepts, qualifies, and handles the outreach flood before it reaches you.

## The Problem

CEOs and executives are drowning in cold emails and AI-generated spam from tools like Apollo, Clay, GoHighLevel, Polsia, and Instantly. The outreach arms race has made inboxes unusable — every dollar spent on offense creates demand for defense.

## The Solution

Moat is an AI-powered inbound defense system that sits between your inbox and the outside world:

- **AI Classification Engine** — Scores every inbound message with a threat level and detects which outreach tool sent it
- **Agent-to-Agent Negotiation** — Your Moat agent intercepts and qualifies inbound AI agents before anything reaches you
- **Defense Rules Engine** — Configurable rules for blocking template variables, detecting sequences, and routing qualified leads
- **Allow/Block Lists** — VIP allowlists for investors and partners, permanent blocklists for spam infrastructure
- **Agent Posture Control** — Passive (log only), Defensive (qualify), or Aggressive (honeypot + counter-intel)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude (classification + agent conversations)
- **Auth**: NextAuth.js (Google OAuth)
- **Email Integration**: Gmail API, Microsoft Graph API
- **Transactional Email**: Resend

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your keys

# Push database schema
npm run db:push

# Run development server
npm run dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login/signup pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   └── ui/                # Reusable UI primitives
├── hooks/                 # Custom React hooks
├── lib/
│   ├── ai/               # Claude classification + agent engine
│   ├── db/               # Drizzle schema + queries
│   └── integrations/     # Gmail, Outlook, LinkedIn connectors
└── types/                 # TypeScript type definitions
```

## License

Proprietary — Launchabl LLC
