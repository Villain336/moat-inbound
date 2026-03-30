'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title,
  Text,
  Card,
  Button,
  TextInput,
  Group,
  Badge,
  UnstyledButton,
} from '@mantine/core';
import { formatDistanceToNow } from 'date-fns';

interface ListEntry {
  id: string;
  entry: string;
  entryType: string;
  notes?: string | null;
  reason?: string | null;
  addedBy: string | null;
  createdAt: Date;
}

export function AllowBlockLists({
  allowlist,
  blocklist,
}: {
  allowlist: ListEntry[];
  blocklist: ListEntry[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <Title order={2} className="font-display tracking-tight">Allow / Block Lists</Title>
        <Text size="xs" c="dimmed" className="font-mono mt-1">
          MANAGE TRUSTED AND BLOCKED SENDERS
        </Text>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <ListSection
          title="Allowlist"
          subtitle="Trusted senders auto-approved"
          entries={allowlist}
          color="green"
          endpoint="/api/allowlist"
        />
        <ListSection
          title="Blocklist"
          subtitle="Permanently blocked senders"
          entries={blocklist}
          color="red"
          endpoint="/api/blocklist"
        />
      </div>
    </div>
  );
}

function ListSection({
  title,
  subtitle,
  entries,
  color,
  endpoint,
}: {
  title: string;
  subtitle: string;
  entries: ListEntry[];
  color: 'green' | 'red';
  endpoint: string;
}) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const items = input.split(',').map((s) => s.trim()).filter(Boolean);
    for (const item of items) {
      const entryType = item.includes('@') ? 'email' : 'domain';
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: item, entryType }),
      });
    }
    setInput('');
    setLoading(false);
    router.refresh();
  };

  const handleRemove = async (id: string) => {
    await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <Card
      padding="lg"
      radius="lg"
      className={`bg-metallic shadow-card border ${
        color === 'green' ? 'border-moat-success/20' : 'border-moat-danger/20'
      }`}
    >
      <div className="mb-4">
        <Text fw={600} size="lg" className="font-display" c={color === 'green' ? 'green' : 'red'}>
          {title}
        </Text>
        <Text size="xs" c="dimmed" className="font-mono mt-0.5">{subtitle}</Text>
      </div>

      <Group gap="xs" className="mb-4">
        <TextInput
          flex={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="domain.com or email@domain.com"
          size="sm"
          className="font-mono"
        />
        <Button
          onClick={handleAdd}
          loading={loading}
          variant="light"
          color={color}
          size="sm"
        >
          Add
        </Button>
      </Group>

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/60 group"
          >
            <Text size="sm" className="font-mono flex-1 truncate">
              {entry.entry}
            </Text>
            <Badge variant="light" color="gray" size="xs">{entry.entryType}</Badge>
            <Text size="xs" c="dimmed" className="font-mono">
              {entry.addedBy || 'manual'}
            </Text>
            <Text size="xs" c="dimmed" className="font-mono w-14 text-right">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: false })}
            </Text>
            <UnstyledButton
              onClick={() => handleRemove(entry.id)}
              className="opacity-0 group-hover:opacity-100 text-moat-silver-dark hover:text-moat-danger text-xs transition-opacity"
            >
              {'\u2715'}
            </UnstyledButton>
          </div>
        ))}
        {entries.length === 0 && (
          <Text size="sm" c="dimmed" className="font-mono text-center py-6">
            No entries yet
          </Text>
        )}
      </div>
    </Card>
  );
}
