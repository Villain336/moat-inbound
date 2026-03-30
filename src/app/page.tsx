import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  SimpleGrid,
  Card,
  Badge,
  Divider,
  Stack,
} from '@mantine/core';

const FEATURES = [
  {
    icon: '\u25C9',
    title: 'AI Classification Engine',
    description:
      'Every inbound message scored for threat level, AI-generation patterns, and enrichment signals. Powered by Claude.',
  },
  {
    icon: '\u2694',
    title: 'Agent Defense',
    description:
      'Your defense agent intercepts suspicious outreach, qualifies senders, and engages other AI agents in negotiation.',
  },
  {
    icon: '\u2699',
    title: 'Rules Engine',
    description:
      'Configurable rules for template variable blocking, sequence detection, domain reputation, and lead routing.',
  },
  {
    icon: '\u26A1',
    title: 'Tool Detection',
    description:
      'Fingerprint-level identification of Apollo, Clay, GoHighLevel, Outreach, Instantly, SalesLoft, and 6 more.',
  },
  {
    icon: '\u25CE',
    title: 'Allow / Block Lists',
    description:
      'VIP allowlists for investors and partners. Permanent blocklists for spam infrastructure. Auto-suggestions.',
  },
  {
    icon: '\u25A0',
    title: 'Command Center',
    description:
      'Real-time dashboard: blocked, intercepted, approved. Weekly trends. Tool detection leaderboard.',
  },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try the defense',
    features: [
      '50 messages / month',
      'Basic classification',
      'Allow / block lists',
      '3 defense rules',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/ mo',
    description: 'Full protection',
    features: [
      'Unlimited messages',
      'Full AI classification',
      'Agent defense — all postures',
      'Unlimited rules',
      'Tool detection',
      'Auto-unsubscribe',
    ],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Executive',
    price: '$149',
    period: '/ mo',
    description: 'Multi-inbox defense',
    features: [
      'Everything in Pro',
      'Up to 5 inboxes',
      'Team dashboard',
      'Threat intelligence feed',
      'Custom qualification scripts',
      'API access',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-moat-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Container size="lg" className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-moat-black flex items-center justify-center text-moat-yellow text-lg font-extrabold">
              M
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-moat-black">
              MOAT
            </span>
          </div>
          <Group gap="sm">
            <Button
              component={Link}
              href="/login"
              variant="subtle"
              color="dark"
              size="sm"
            >
              Log in
            </Button>
            <Button
              component={Link}
              href="/login"
              color="dark"
              size="sm"
              className="bg-moat-black hover:bg-moat-black/90"
            >
              Protect Your Inbox
            </Button>
          </Group>
        </Container>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <Container size="md" className="text-center pt-24 pb-20 relative">
          <Badge
            color="red"
            variant="light"
            size="lg"
            radius="xl"
            className="mb-8"
          >
            AVG EXECUTIVE: 120+ COLD EMAILS / DAY
          </Badge>

          <Title
            order={1}
            className="text-5xl lg:text-7xl font-display font-bold tracking-tight leading-[1.05] mb-6"
          >
            Stop the{' '}
            <span className="bg-moat-yellow px-2 -mx-1 text-moat-black inline-block -rotate-1">
              Flood
            </span>
          </Title>

          <Text
            size="xl"
            c="dimmed"
            className="max-w-xl mx-auto mb-10 leading-relaxed"
          >
            AI chief of staff that intercepts, qualifies, and handles
            the outreach flood before it reaches you.
          </Text>

          <Group justify="center" gap="md" className="mb-16">
            <Button
              component={Link}
              href="/login"
              size="xl"
              color="dark"
              className="bg-moat-black hover:bg-moat-black/90 shadow-metallic-hover"
            >
              Protect Your Inbox
            </Button>
            <Button
              component={Link}
              href="#features"
              size="xl"
              variant="default"
              className="shadow-metallic hover:shadow-metallic-hover border-moat-border"
            >
              See How It Works
            </Button>
          </Group>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { value: '12M+', label: 'Messages Analyzed' },
              { value: '94%', label: 'Spam Caught' },
              { value: '<2s', label: 'Classification' },
            ].map((stat) => (
              <div key={stat.label}>
                <Text fw={800} size="xl" className="font-display">
                  {stat.value}
                </Text>
                <Text size="xs" c="dimmed" className="font-mono tracking-wide uppercase">
                  {stat.label}
                </Text>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Tools Ticker */}
      <div className="border-y border-moat-border py-3 overflow-hidden bg-moat-surface">
        <div className="flex gap-8 animate-[scroll_40s_linear_infinite] whitespace-nowrap">
          {[
            'Apollo.io', 'Clay', 'GoHighLevel', 'Outreach.io', 'Instantly',
            'SalesLoft', 'Polsia', 'Lemlist', 'HubSpot', 'Mailshake',
            'Woodpecker', 'Reply.io',
            'Apollo.io', 'Clay', 'GoHighLevel', 'Outreach.io', 'Instantly',
            'SalesLoft', 'Polsia', 'Lemlist', 'HubSpot', 'Mailshake',
            'Woodpecker', 'Reply.io',
          ].map((tool, i) => (
            <span
              key={i}
              className="font-mono text-xs text-moat-silver-dark flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-moat-yellow" />
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-20">
        <Container size="lg">
          <div className="text-center mb-14">
            <Title order={2} className="font-display text-3xl lg:text-4xl tracking-tight mb-3">
              Defense in Depth
            </Title>
            <Text c="dimmed" className="max-w-lg mx-auto">
              Six layers of protection between the outreach flood and your inbox.
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                padding="xl"
                radius="lg"
                className="bg-metallic shadow-card hover:shadow-card-hover transition-shadow border border-moat-border"
              >
                <Text className="text-2xl mb-3 text-moat-black">{f.icon}</Text>
                <Text fw={600} size="lg" className="font-display mb-2">
                  {f.title}
                </Text>
                <Text size="sm" c="dimmed" className="leading-relaxed">
                  {f.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-moat-black text-white">
        <Container size="md">
          <div className="text-center mb-14">
            <Title order={2} className="font-display text-3xl lg:text-4xl tracking-tight mb-3 text-white">
              Three Steps to Silence
            </Title>
          </div>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
            {[
              {
                step: '01',
                title: 'Connect',
                description: 'One-click Google OAuth. Moat reads your inbox in real-time. No forwarding.',
              },
              {
                step: '02',
                title: 'Classify',
                description: 'Every message scored for threats, checked against rules, fingerprinted for tool signatures.',
              },
              {
                step: '03',
                title: 'Defend',
                description: 'Suspicious senders intercepted. Your agent qualifies them before anything reaches you.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <Text className="font-mono text-moat-yellow text-3xl font-bold mb-3">
                  {item.step}
                </Text>
                <Text fw={600} size="lg" className="font-display mb-2 text-white">
                  {item.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {item.description}
                </Text>
              </div>
            ))}
          </SimpleGrid>
        </Container>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <Container size="lg">
          <div className="text-center mb-14">
            <Title order={2} className="font-display text-3xl lg:text-4xl tracking-tight mb-3">
              Simple Pricing
            </Title>
            <Text c="dimmed">Start free. Upgrade when the flood gets serious.</Text>
          </div>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {PRICING.map((plan) => (
              <Card
                key={plan.name}
                padding="xl"
                radius="lg"
                className={`shadow-card hover:shadow-card-hover transition-shadow border ${
                  plan.featured
                    ? 'border-moat-yellow bg-moat-yellow/[0.04]'
                    : 'border-moat-border bg-metallic'
                }`}
              >
                {plan.featured && (
                  <Badge color="yellow" variant="filled" size="sm" className="mb-3 text-moat-black">
                    MOST POPULAR
                  </Badge>
                )}
                <Text fw={700} size="xl" className="font-display">
                  {plan.name}
                </Text>
                <Group gap={4} className="mt-1 mb-1" align="baseline">
                  <Text fw={800} className="text-3xl font-display">
                    {plan.price}
                  </Text>
                  <Text size="sm" c="dimmed">{plan.period}</Text>
                </Group>
                <Text size="sm" c="dimmed" className="mb-5">
                  {plan.description}
                </Text>
                <Stack gap="xs" className="mb-6">
                  {plan.features.map((f) => (
                    <Text key={f} size="sm" className="flex items-center gap-2">
                      <span className="text-moat-success text-xs">{'\u2713'}</span>
                      {f}
                    </Text>
                  ))}
                </Stack>
                <Button
                  component={Link}
                  href="/login"
                  fullWidth
                  variant={plan.featured ? 'filled' : 'default'}
                  color={plan.featured ? 'dark' : undefined}
                  className={plan.featured ? 'bg-moat-black hover:bg-moat-black/90' : 'shadow-metallic'}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 bg-moat-surface border-t border-moat-border">
        <Container size="sm" className="text-center">
          <Title order={2} className="font-display text-3xl tracking-tight mb-4">
            Reclaim Your Inbox
          </Title>
          <Text c="dimmed" className="mb-8">
            Join executives who stopped drowning in cold email.
          </Text>
          <Button
            component={Link}
            href="/login"
            size="xl"
            color="dark"
            className="bg-moat-black hover:bg-moat-black/90 shadow-metallic-hover"
          >
            Protect Your Inbox -- Free
          </Button>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-moat-border">
        <Container size="lg" className="flex items-center justify-between">
          <Group gap="xs">
            <div className="w-6 h-6 rounded bg-moat-black flex items-center justify-center text-moat-yellow text-[10px] font-extrabold">
              M
            </div>
            <Text size="xs" c="dimmed" className="font-mono tracking-widest">
              MOAT DEFENSE SYSTEM
            </Text>
          </Group>
          <Text size="xs" c="dimmed" className="font-mono">
            {'\u00A9'} 2026 Launchabl LLC
          </Text>
        </Container>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`,
        }}
      />
    </main>
  );
}
