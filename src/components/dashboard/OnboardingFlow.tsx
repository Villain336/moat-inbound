'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { clsx } from 'clsx';
import {
  Title,
  Text,
  Button,
  Card,
  Group,
  TextInput,
  Switch,
  Stepper,
  UnstyledButton,
  Stack,
} from '@mantine/core';

interface Rule {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  isEnabled: boolean;
  isSystem: boolean;
}

const POSTURES = [
  { value: 'passive' as const, label: 'Passive', icon: '\u25CB', description: 'Classify and log only. No engagement with senders.' },
  { value: 'defensive' as const, label: 'Defensive', icon: '\u25CE', description: 'Politely engage with qualification questions. Professional and thorough.' },
  { value: 'aggressive' as const, label: 'Aggressive', icon: '\u25C9', description: 'Aggressively qualify. Waste time of confirmed automated senders.' },
];

export function OnboardingFlow({
  userId,
  hasGmail,
  rules,
  currentPosture,
}: {
  userId: string;
  hasGmail: boolean;
  rules: Rule[];
  currentPosture: 'passive' | 'defensive' | 'aggressive';
}) {
  const router = useRouter();
  const [step, setStep] = useState(hasGmail ? 1 : 0);
  const [posture, setPosture] = useState(currentPosture);
  const [allowlistInput, setAllowlistInput] = useState('');
  const [allowlistEntries, setAllowlistEntries] = useState<string[]>([]);
  const [ruleToggles, setRuleToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(rules.map((r) => [r.id, r.isEnabled]))
  );
  const [saving, setSaving] = useState(false);

  const addToAllowlist = () => {
    const items = allowlistInput.split(',').map((s) => s.trim()).filter((s) => s && !allowlistEntries.includes(s));
    if (items.length > 0) {
      setAllowlistEntries((prev) => [...prev, ...items]);
      setAllowlistInput('');
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch('/api/agent/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentPosture: posture }),
      });
      for (const entry of allowlistEntries) {
        await fetch('/api/allowlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry, entryType: entry.includes('@') ? 'email' : 'domain' }),
        });
      }
      for (const rule of rules) {
        if (ruleToggles[rule.id] !== rule.isEnabled) {
          await fetch(`/api/rules/${rule.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toggle: true }) });
        }
      }
      router.push('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Stepper active={step} color="yellow" size="sm" className="mb-10">
        <Stepper.Step label="Connect" />
        <Stepper.Step label="Posture" />
        <Stepper.Step label="Allowlist" />
        <Stepper.Step label="Rules" />
        <Stepper.Step label="Ready" />
      </Stepper>

      {/* Step 0: Connect */}
      {step === 0 && (
        <div>
          <Title order={3} className="font-display mb-2">Connect Your Inbox</Title>
          <Text c="dimmed" className="mb-8">Moat needs access to your Gmail to classify and defend your inbox in real-time.</Text>
          <Button
            onClick={() => signIn('google', { callbackUrl: '/dashboard/onboarding' })}
            fullWidth
            variant="default"
            size="lg"
            className="shadow-metallic hover:shadow-metallic-hover"
            leftSection={<span className="font-mono">{'\u2709'}</span>}
          >
            Connect Gmail
          </Button>
          {hasGmail && (
            <Card padding="sm" radius="md" className="mt-4 bg-moat-success/10 border border-moat-success/20">
              <Text size="sm" c="green" className="font-mono">{'\u2713'} Gmail connected successfully</Text>
            </Card>
          )}
        </div>
      )}

      {/* Step 1: Posture */}
      {step === 1 && (
        <div>
          <Title order={3} className="font-display mb-2">Choose Defense Posture</Title>
          <Text c="dimmed" className="mb-8">How should your agent handle suspicious outreach?</Text>
          <Stack gap="sm">
            {POSTURES.map((p) => (
              <UnstyledButton
                key={p.value}
                onClick={() => setPosture(p.value)}
                className={clsx(
                  'w-full p-5 rounded-xl border text-left transition-all',
                  posture === p.value
                    ? 'border-moat-yellow bg-moat-yellow/10 shadow-sm'
                    : 'border-moat-border bg-metallic shadow-card hover:shadow-card-hover'
                )}
              >
                <Group>
                  <Text className="text-2xl font-mono">{p.icon}</Text>
                  <div>
                    <Text fw={600} className="font-display">{p.label}</Text>
                    <Text size="xs" c="dimmed" className="mt-0.5">{p.description}</Text>
                  </div>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        </div>
      )}

      {/* Step 2: Allowlist */}
      {step === 2 && (
        <div>
          <Title order={3} className="font-display mb-2">Seed Your Allowlist</Title>
          <Text c="dimmed" className="mb-8">Add trusted domains and emails that should always pass through.</Text>
          <Group gap="xs" className="mb-4">
            <TextInput
              flex={1}
              value={allowlistInput}
              onChange={(e) => setAllowlistInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToAllowlist()}
              placeholder="a16z.com, partner@firm.com"
              size="sm"
              className="font-mono"
            />
            <Button onClick={addToAllowlist} variant="light" color="green" size="sm">Add</Button>
          </Group>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {allowlistEntries.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-moat-border">
                <Text size="sm" className="font-mono">{entry}</Text>
                <UnstyledButton onClick={() => setAllowlistEntries((prev) => prev.filter((_, idx) => idx !== i))} className="text-moat-silver-dark hover:text-moat-danger text-xs">{'\u2715'}</UnstyledButton>
              </div>
            ))}
            {allowlistEntries.length === 0 && (
              <Text size="sm" c="dimmed" className="font-mono text-center py-4">No entries yet -- you can skip this</Text>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Rules */}
      {step === 3 && (
        <div>
          <Title order={3} className="font-display mb-2">Review Defense Rules</Title>
          <Text c="dimmed" className="mb-8">Default rules protect you out of the box. Toggle any to disable.</Text>
          <Stack gap="xs">
            {rules.map((rule) => (
              <Card key={rule.id} padding="sm" radius="lg" className="bg-metallic shadow-card border border-moat-border">
                <Group>
                  <Switch
                    checked={ruleToggles[rule.id]}
                    onChange={() => setRuleToggles((prev) => ({ ...prev, [rule.id]: !prev[rule.id] }))}
                    color="yellow"
                    size="md"
                  />
                  <div className="flex-1">
                    <Text size="sm" fw={500}>{rule.name}</Text>
                    {rule.description && <Text size="xs" c="dimmed">{rule.description}</Text>}
                  </div>
                </Group>
              </Card>
            ))}
          </Stack>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-2xl bg-moat-black flex items-center justify-center text-moat-yellow text-4xl font-extrabold mx-auto mb-6 shadow-lg">
            M
          </div>
          <Title order={3} className="font-display mb-2">Your Moat is Active</Title>
          <Text c="dimmed" className="mb-8 max-w-md mx-auto">
            Your inbox is now defended. Moat will classify every inbound message and your agent is ready.
          </Text>
          <Button
            onClick={handleComplete}
            loading={saving}
            size="xl"
            color="dark"
            className="bg-moat-black hover:bg-moat-black/90"
          >
            Go to Command Center
          </Button>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <Group justify="space-between" className="mt-10">
          <Button variant="subtle" color="gray" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            {'\u2190'} Back
          </Button>
          <Button variant="default" className="shadow-metallic" onClick={() => setStep((s) => Math.min(4, s + 1))}>
            {step === 3 ? 'Finish Setup' : 'Continue \u2192'}
          </Button>
        </Group>
      )}
    </div>
  );
}
