import Link from 'next/link';

const FEATURES = [
  {
    icon: '🛡',
    title: 'AI Classification Engine',
    description:
      'Claude analyzes every inbound message — scoring threat levels, detecting AI-generated content, and identifying which sales tool sent it.',
  },
  {
    icon: '🤖',
    title: 'Agent Defense',
    description:
      'Your Moat agent intercepts suspicious outreach, qualifies senders with pointed questions, and engages other AI agents in negotiation loops.',
  },
  {
    icon: '⚔',
    title: 'Defense Rules Engine',
    description:
      'Configurable rules for blocking template variables, detecting automated sequences, and routing qualified leads to your inbox.',
  },
  {
    icon: '⚡',
    title: 'Tool Detection',
    description:
      'Fingerprint-level detection of Apollo.io, Clay, GoHighLevel, Outreach.io, Instantly, SalesLoft, Polsia, Lemlist, and more.',
  },
  {
    icon: '◎',
    title: 'Allow / Block Lists',
    description:
      'VIP allowlists for investors and partners. Permanent blocklists for spam infrastructure. Auto-suggestions from your agent.',
  },
  {
    icon: '📊',
    title: 'Command Center',
    description:
      'Real-time dashboard showing blocked, intercepted, and approved messages. Weekly trends. Tool detection leaderboard.',
  },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try the defense',
    features: [
      '50 messages/month',
      'Basic classification',
      'Allow/block lists',
      '3 defense rules',
      'Email support',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'Full protection',
    features: [
      'Unlimited messages',
      'Full AI classification',
      'Agent defense (all postures)',
      'Unlimited rules',
      'Tool detection',
      'Auto-unsubscribe',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Executive',
    price: '$149',
    period: '/month',
    description: 'Multi-inbox defense',
    features: [
      'Everything in Pro',
      'Up to 5 connected inboxes',
      'Team dashboard',
      'Threat intelligence feed',
      'Custom qualification scripts',
      'Dedicated account manager',
      'API access',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

const TOOLS_DETECTED = [
  'Apollo.io',
  'Clay',
  'GoHighLevel',
  'Outreach.io',
  'Instantly',
  'SalesLoft',
  'Polsia',
  'Lemlist',
  'HubSpot Sequences',
  'Mailshake',
  'Woodpecker',
  'Reply.io',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-moat-bg text-white overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-moat-green to-moat-blue flex items-center justify-center text-lg font-extrabold shadow-[0_0_20px_rgba(52,199,89,0.25)]">
            M
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            MOAT
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-white/50 hover:text-white text-sm font-medium transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-moat-green/15 text-moat-green text-sm font-semibold border border-moat-green/25 hover:bg-moat-green/25 transition-colors"
          >
            Protect Your Inbox
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 lg:px-12 pt-20 pb-24 text-center max-w-4xl mx-auto">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-moat-red/10 border border-moat-red/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-moat-red animate-pulse" />
          <span className="font-mono text-[11px] text-moat-red font-semibold tracking-wide">
            AVG EXECUTIVE: 120+ COLD EMAILS/DAY
          </span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-bold font-display tracking-tight leading-[1.1] mb-6">
          Stop the
          <span className="bg-gradient-to-r from-moat-green to-moat-blue bg-clip-text text-transparent">
            {' '}
            Flood
          </span>
        </h1>

        <p className="text-lg lg:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Moat is your AI chief of staff that intercepts, qualifies, and handles
          the outreach flood before it reaches you. Powered by Claude.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-moat-green to-moat-blue text-white font-semibold text-base shadow-[0_0_30px_rgba(52,199,89,0.2)] hover:shadow-[0_0_40px_rgba(52,199,89,0.3)] transition-shadow"
          >
            Protect Your Inbox
          </Link>
          <Link
            href="#features"
            className="px-8 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 font-medium text-base hover:bg-white/[0.08] transition-colors"
          >
            See How It Works
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { value: '12M+', label: 'Messages Analyzed' },
            { value: '94%', label: 'Spam Caught' },
            { value: '<2s', label: 'Classification Time' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold font-display text-white">
                {stat.value}
              </div>
              <div className="text-[10px] font-mono text-white/30 tracking-wider mt-1">
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools Ticker */}
      <section className="border-y border-white/[0.06] py-4 overflow-hidden">
        <div className="flex gap-6 animate-[scroll_30s_linear_infinite] whitespace-nowrap">
          {[...TOOLS_DETECTED, ...TOOLS_DETECTED].map((tool, i) => (
            <span
              key={i}
              className="font-mono text-xs text-moat-purple/60 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-moat-purple/40" />
              {tool}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 lg:px-12 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight mb-4">
            Defense in Depth
          </h2>
          <p className="text-white/40 max-w-xl mx-auto">
            Six layers of AI-powered protection between the outreach flood and
            your inbox.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-display font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 lg:px-12 py-20 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight mb-4">
              Three Steps to Silence
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Gmail',
                description:
                  'One-click Google OAuth. Moat reads your inbox in real-time via push notifications. No forwarding, no delays.',
              },
              {
                step: '02',
                title: 'AI Classifies',
                description:
                  'Every message is scored for threat level, checked against defense rules, and fingerprinted for sales tool signatures.',
              },
              {
                step: '03',
                title: 'Agent Defends',
                description:
                  'Suspicious senders are intercepted. Your Moat agent qualifies them with pointed questions before anything reaches you.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="font-mono text-moat-green text-3xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="px-6 lg:px-12 py-20 border-t border-white/[0.06]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight mb-4">
              Simple Pricing
            </h2>
            <p className="text-white/40">
              Start free. Upgrade when the flood gets serious.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-2xl border ${
                  plan.featured
                    ? 'border-moat-green/30 bg-moat-green/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                {plan.featured && (
                  <div className="font-mono text-[10px] text-moat-green tracking-widest font-semibold mb-3">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-1">
                  <span className="text-3xl font-bold font-display">
                    {plan.price}
                  </span>
                  <span className="text-white/30 text-sm">{plan.period}</span>
                </div>
                <p className="text-white/40 text-sm mb-6">
                  {plan.description}
                </p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-white/60"
                    >
                      <span className="text-moat-green text-xs">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-moat-green/20 text-moat-green border border-moat-green/30 hover:bg-moat-green/30'
                      : 'bg-white/[0.06] text-white/70 border border-white/[0.08] hover:bg-white/[0.1]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-12 py-20 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight mb-4">
            Reclaim Your Inbox
          </h2>
          <p className="text-white/40 mb-8">
            Join executives who stopped drowning in cold email and let AI handle
            the flood.
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-moat-green to-moat-blue text-white font-semibold text-lg shadow-[0_0_30px_rgba(52,199,89,0.2)] hover:shadow-[0_0_50px_rgba(52,199,89,0.3)] transition-shadow"
          >
            Protect Your Inbox — Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 border-t border-white/[0.06]">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-moat-green to-moat-blue flex items-center justify-center text-xs font-extrabold">
              M
            </div>
            <span className="font-mono text-[10px] text-white/25 tracking-widest">
              MOAT DEFENSE SYSTEM
            </span>
          </div>
          <div className="text-[11px] text-white/20 font-mono">
            &copy; 2026 Launchabl LLC
          </div>
        </div>
      </footer>

      {/* Scroll animation keyframe */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`,
        }}
      />
    </main>
  );
}
