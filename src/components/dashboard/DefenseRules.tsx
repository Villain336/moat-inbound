'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title,
  Text,
  Card,
  Button,
  Group,
  Switch,
  Badge,
  TextInput,
  Select,
  Modal,
  Stack,
} from '@mantine/core';

interface Rule {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  conditions: unknown;
  isEnabled: boolean;
  isSystem: boolean;
  timesTriggered: number;
}

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  hard_block: { color: 'red', label: 'HARD BLOCK' },
  intercept: { color: 'orange', label: 'INTERCEPT' },
  qualify: { color: 'blue', label: 'QUALIFY' },
  delay: { color: 'violet', label: 'DELAY' },
  approve: { color: 'green', label: 'APPROVE' },
};

export function DefenseRulesPage({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggle = async (ruleId: string) => {
    await fetch(`/api/rules/${ruleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggle: true }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <Group justify="space-between">
        <div>
          <Title order={2} className="font-display tracking-tight">Defense Rules</Title>
          <Text size="xs" c="dimmed" className="font-mono mt-1">
            {rules.length} RULES CONFIGURED
          </Text>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          variant="default"
          size="sm"
          className="shadow-metallic font-display"
        >
          + Add Rule
        </Button>
      </Group>

      <div className="space-y-2">
        {rules.map((rule) => {
          const sev = SEVERITY_CONFIG[rule.severity] || SEVERITY_CONFIG.intercept;
          return (
            <Card
              key={rule.id}
              padding="md"
              radius="lg"
              className="bg-metallic shadow-card border border-moat-border flex items-center gap-4"
            >
              <Switch
                checked={rule.isEnabled}
                onChange={() => handleToggle(rule.id)}
                color="yellow"
                size="md"
              />
              <div className="flex-1 min-w-0">
                <Group gap="xs">
                  <Text size="sm" fw={500}>{rule.name}</Text>
                  {rule.isSystem && (
                    <Badge variant="light" color="gray" size="xs">
                      SYSTEM
                    </Badge>
                  )}
                </Group>
                {rule.description && (
                  <Text size="xs" c="dimmed" className="mt-0.5">
                    {rule.description}
                  </Text>
                )}
              </div>
              <Badge variant="light" color={sev.color} size="xs" className="font-mono tracking-wider">
                {sev.label}
              </Badge>
              <Text size="xs" c="dimmed" className="font-mono w-12 text-right">
                {rule.timesTriggered}x
              </Text>
              {!rule.isSystem && (
                <Button
                  variant="subtle"
                  color="red"
                  size="compact-xs"
                  onClick={async () => {
                    await fetch(`/api/rules/${rule.id}`, { method: 'DELETE' });
                    router.refresh();
                  }}
                >
                  {'\u2715'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <AddRuleModal
        opened={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => { setShowAddForm(false); router.refresh(); }}
      />
    </div>
  );
}

function AddRuleModal({
  opened,
  onClose,
  onSuccess,
}: {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string | null>('intercept');
  const [conditionType, setConditionType] = useState<string | null>('body_contains_any');
  const [conditionValues, setConditionValues] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const conditions: Record<string, unknown> = { type: conditionType };
    if (['body_contains_any', 'header_match', 'sender_domain_in', 'classification_is'].includes(conditionType || '')) {
      conditions.values = conditionValues.split(',').map((v) => v.trim()).filter(Boolean);
    }
    if (['threat_score_above', 'ai_patterns_score', 'spam_score_above'].includes(conditionType || '')) {
      conditions.threshold = parseInt(conditionValues, 10) || 50;
    }

    try {
      await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, severity, conditions }),
      });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} className="font-display">New Rule</Text>}
      centered
      radius="lg"
    >
      <Stack gap="md">
        <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} required className="font-mono" />
        <TextInput label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Select
          label="Severity"
          value={severity}
          onChange={setSeverity}
          data={[
            { value: 'hard_block', label: 'Hard Block' },
            { value: 'intercept', label: 'Intercept' },
            { value: 'qualify', label: 'Qualify' },
            { value: 'delay', label: 'Delay' },
            { value: 'approve', label: 'Approve' },
          ]}
        />
        <Select
          label="Condition Type"
          value={conditionType}
          onChange={setConditionType}
          data={[
            { value: 'body_contains_any', label: 'Body Contains Any' },
            { value: 'header_match', label: 'Header Match' },
            { value: 'sender_domain_in', label: 'Sender Domain In' },
            { value: 'classification_is', label: 'Classification Is' },
            { value: 'threat_score_above', label: 'Threat Score Above' },
            { value: 'ai_patterns_score', label: 'AI Patterns Score' },
          ]}
        />
        <TextInput
          label="Values"
          value={conditionValues}
          onChange={(e) => setConditionValues(e.target.value)}
          placeholder="e.g. apollo, clay, outreach"
          required
          className="font-mono"
        />
        <Button
          onClick={handleSubmit}
          loading={loading}
          color="dark"
          fullWidth
          className="bg-moat-black hover:bg-moat-black/90"
        >
          Create Rule
        </Button>
      </Stack>
    </Modal>
  );
}
