'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Title,
  Text,
  Card,
  Button,
  Group,
  Switch,
  TextInput,
  UnstyledButton,
  Stack,
} from '@mantine/core';
import type { AgentPosture } from '@/types';

const POSTURES: Array<{
  value: AgentPosture;
  label: string;
  description: string;
  icon: string;
}> = [
  { value: 'passive', label: 'Passive', description: 'Classify and log only. No engagement with senders.', icon: '\u25CB' },
  { value: 'defensive', label: 'Defensive', description: 'Politely engage senders with qualification questions. Professional and thorough.', icon: '\u25CE' },
  { value: 'aggressive', label: 'Aggressive', description: 'Aggressively qualify. Ask pointed questions. Waste time of confirmed automated senders.', icon: '\u25C9' },
];

const CAPABILITIES = [
  { key: 'agent_negotiation', label: 'Agent-to-Agent Negotiation', description: 'Detect and engage other AI agents in qualification dialog' },
  { key: 'fingerprinting', label: 'Linguistic Fingerprinting', description: 'Analyze writing patterns to detect AI-generated content' },
  { key: 'tool_detection', label: 'Tool Signature Detection', description: 'Identify which sales tools sent the message via headers and patterns' },
  { key: 'cross_reference', label: 'Cross-Reference Verification', description: 'Verify sender claims against LinkedIn and public data' },
  { key: 'auto_unsubscribe', label: 'Auto-Unsubscribe', description: 'Automatically unsubscribe from detected sequences' },
  { key: 'honeypot', label: 'Honeypot Engagement', description: 'Extended engagement to waste automated sender resources' },
];

export function AgentConfigPage({
  agentPosture,
  capabilities,
  qualificationQuestions,
}: {
  agentPosture: AgentPosture;
  capabilities: Record<string, boolean>;
  qualificationQuestions: string[];
}) {
  const router = useRouter();
  const [posture, setPosture] = useState(agentPosture);
  const [caps, setCaps] = useState(capabilities);
  const [questions, setQuestions] = useState(qualificationQuestions);
  const [newQuestion, setNewQuestion] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/agent/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentPosture: posture, capabilities: caps, qualificationQuestions: questions }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Group justify="space-between">
        <div>
          <Title order={2} className="font-display tracking-tight">Agent Configuration</Title>
          <Text size="xs" c="dimmed" className="font-mono mt-1">CONFIGURE YOUR AI DEFENSE AGENT</Text>
        </div>
        <Button onClick={save} loading={saving} color="dark" className="bg-moat-black hover:bg-moat-black/90">
          Save Changes
        </Button>
      </Group>

      {/* Posture */}
      <div>
        <Text size="xs" c="dimmed" className="font-mono tracking-widest mb-3">AGENT POSTURE</Text>
        <div className="grid sm:grid-cols-3 gap-3">
          {POSTURES.map((p) => (
            <UnstyledButton
              key={p.value}
              onClick={() => setPosture(p.value)}
              className={clsx(
                'p-5 rounded-xl border text-left transition-all',
                posture === p.value
                  ? 'border-moat-yellow bg-moat-yellow/10 shadow-sm'
                  : 'border-moat-border bg-metallic hover:border-moat-border-strong shadow-card'
              )}
            >
              <Text className="text-2xl mb-2 font-mono">{p.icon}</Text>
              <Text fw={600} size="sm" className="font-display mb-1">{p.label}</Text>
              <Text size="xs" c="dimmed" className="leading-relaxed">{p.description}</Text>
            </UnstyledButton>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <Text size="xs" c="dimmed" className="font-mono tracking-widest mb-3">CAPABILITIES</Text>
        <Stack gap="xs">
          {CAPABILITIES.map((cap) => (
            <Card
              key={cap.key}
              padding="md"
              radius="lg"
              className="bg-metallic shadow-card border border-moat-border"
            >
              <Group>
                <Switch
                  checked={caps[cap.key] || false}
                  onChange={() => setCaps((prev) => ({ ...prev, [cap.key]: !prev[cap.key] }))}
                  color="yellow"
                  size="md"
                />
                <div className="flex-1">
                  <Text size="sm" fw={500}>{cap.label}</Text>
                  <Text size="xs" c="dimmed" className="mt-0.5">{cap.description}</Text>
                </div>
              </Group>
            </Card>
          ))}
        </Stack>
      </div>

      {/* Qualification Script */}
      <div>
        <Text size="xs" c="dimmed" className="font-mono tracking-widest mb-3">QUALIFICATION QUESTIONS</Text>
        <Card padding="lg" radius="lg" className="bg-metallic shadow-card border border-moat-border">
          <Stack gap="xs">
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-moat-border group">
                <Text size="xs" c="dimmed" className="font-mono mt-0.5 w-4 shrink-0">{i + 1}.</Text>
                <Text size="sm" className="flex-1">{q}</Text>
                <UnstyledButton
                  onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="opacity-0 group-hover:opacity-100 text-moat-silver-dark hover:text-moat-danger text-xs transition-opacity shrink-0"
                >
                  {'\u2715'}
                </UnstyledButton>
              </div>
            ))}
            <Group gap="xs">
              <TextInput
                flex={1}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newQuestion.trim()) {
                    setQuestions((prev) => [...prev, newQuestion.trim()]);
                    setNewQuestion('');
                  }
                }}
                placeholder="Add a qualification question..."
                size="sm"
              />
              <Button
                variant="default"
                size="sm"
                className="shadow-metallic"
                onClick={() => {
                  if (newQuestion.trim()) {
                    setQuestions((prev) => [...prev, newQuestion.trim()]);
                    setNewQuestion('');
                  }
                }}
              >
                Add
              </Button>
            </Group>
          </Stack>
        </Card>
      </div>
    </div>
  );
}
