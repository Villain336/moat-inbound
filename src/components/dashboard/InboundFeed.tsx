'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Title,
  Text,
  Card,
  Button,
  Group,
  UnstyledButton,
  SegmentedControl,
} from '@mantine/core';
import { ThreatBadge, StatusPill, ToolTag, ChannelIcon } from '@/components/ui/badges';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  channel: string;
  senderEmail: string | null;
  senderName: string | null;
  senderCompany: string | null;
  senderDomain: string | null;
  subject: string | null;
  bodyPreview: string | null;
  bodyFull: string | null;
  threatScore: number | null;
  classification: string | null;
  toolDetected: string | null;
  status: string;
  aiAnalysis: Record<string, unknown> | null;
  matchedRules: unknown;
  receivedAt: Date;
}

export function InboundFeed({
  messages,
  total,
  page,
  totalPages,
  currentStatus,
  selectedId,
}: {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
  currentStatus: string;
  selectedId?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Message | null>(
    messages.find((m) => m.id === selectedId) || null
  );

  return (
    <div className="space-y-4">
      <div>
        <Title order={2} className="font-display tracking-tight">Inbound Feed</Title>
        <Text size="xs" c="dimmed" className="font-mono mt-1">
          {total} MESSAGES PROCESSED
        </Text>
      </div>

      <SegmentedControl
        value={currentStatus}
        onChange={(val) => {
          router.push(`/dashboard/inbox${val !== 'all' ? `?status=${val}` : ''}`);
        }}
        data={[
          { value: 'all', label: 'All' },
          { value: 'blocked', label: 'Blocked' },
          { value: 'intercepted', label: 'Intercepted' },
          { value: 'agent_handling', label: 'Agent' },
          { value: 'approved', label: 'Approved' },
        ]}
        size="xs"
        className="font-mono"
      />

      <div className="flex gap-4">
        {/* Message List */}
        <div className="flex-1 space-y-1">
          {messages.map((msg) => (
            <UnstyledButton
              key={msg.id}
              onClick={() => setSelected(msg)}
              className={clsx(
                'w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all',
                selected?.id === msg.id
                  ? 'bg-moat-yellow/10 border border-moat-yellow/30 shadow-sm'
                  : 'hover:bg-moat-surface border border-transparent'
              )}
            >
              <ChannelIcon channel={msg.channel} />
              <div className="flex-1 min-w-0">
                <Group gap="xs">
                  <Text size="sm" fw={500} truncate>
                    {msg.senderName || msg.senderEmail || 'Unknown'}
                  </Text>
                  {msg.senderCompany && (
                    <Text size="xs" c="dimmed" className="font-mono hidden sm:inline" truncate>
                      {msg.senderCompany}
                    </Text>
                  )}
                </Group>
                <Text size="xs" c="dimmed" truncate>{msg.subject}</Text>
              </div>
              <Group gap="xs" wrap="nowrap">
                <ToolTag tool={msg.toolDetected} />
                <ThreatBadge score={msg.threatScore ?? 0} />
                <StatusPill status={msg.status} />
                <Text size="xs" c="dimmed" className="font-mono w-14 text-right hidden md:block">
                  {formatDistanceToNow(new Date(msg.receivedAt), { addSuffix: false })}
                </Text>
              </Group>
            </UnstyledButton>
          ))}
          {messages.length === 0 && (
            <Text size="sm" c="dimmed" className="font-mono text-center py-16">
              No messages found
            </Text>
          )}

          {totalPages > 1 && (
            <Group justify="center" gap="sm" className="pt-4">
              {page > 1 && (
                <Button
                  component={Link}
                  href={`/dashboard/inbox?${currentStatus !== 'all' ? `status=${currentStatus}&` : ''}page=${page - 1}`}
                  variant="default"
                  size="xs"
                  className="font-mono shadow-metallic"
                >
                  {'\u2190'} Prev
                </Button>
              )}
              <Text size="xs" c="dimmed" className="font-mono">
                {page} / {totalPages}
              </Text>
              {page < totalPages && (
                <Button
                  component={Link}
                  href={`/dashboard/inbox?${currentStatus !== 'all' ? `status=${currentStatus}&` : ''}page=${page + 1}`}
                  variant="default"
                  size="xs"
                  className="font-mono shadow-metallic"
                >
                  Next {'\u2192'}
                </Button>
              )}
            </Group>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <Card
            padding="lg"
            radius="lg"
            className="hidden lg:block w-96 bg-metallic shadow-card border border-moat-border sticky top-8 self-start"
          >
            <Group justify="space-between" className="mb-4">
              <StatusPill status={selected.status} />
              <UnstyledButton
                onClick={() => setSelected(null)}
                className="text-moat-silver-dark hover:text-moat-black text-xs"
              >
                {'\u2715'}
              </UnstyledButton>
            </Group>

            <Title order={4} className="font-display mb-1">
              {selected.subject || '(No Subject)'}
            </Title>
            <Group gap="xs" className="mb-4">
              <Text size="sm" c="dimmed">
                {selected.senderName || selected.senderEmail}
              </Text>
              {selected.senderCompany && (
                <>
                  <Text size="xs" c="dimmed">{'\u00B7'}</Text>
                  <Text size="xs" c="dimmed" className="font-mono">
                    {selected.senderCompany}
                  </Text>
                </>
              )}
            </Group>

            <Group gap="xs" className="mb-4">
              <ThreatBadge score={selected.threatScore ?? 0} />
              <ToolTag tool={selected.toolDetected} />
            </Group>

            {selected.aiAnalysis && (
              <div className="mb-4">
                <Text size="xs" c="dimmed" className="font-mono tracking-widest mb-2">
                  AI ANALYSIS
                </Text>
                <Card padding="sm" radius="md" className="bg-white border border-moat-border">
                  <Text size="xs" c="dimmed" className="leading-relaxed">
                    {(selected.aiAnalysis as Record<string, unknown>).reasoning as string || 'No analysis available'}
                  </Text>
                </Card>
              </div>
            )}

            <div className="mb-4">
              <Text size="xs" c="dimmed" className="font-mono tracking-widest mb-2">
                MESSAGE PREVIEW
              </Text>
              <Card padding="sm" radius="md" className="bg-white border border-moat-border max-h-48 overflow-y-auto">
                <Text size="xs" c="dimmed" className="leading-relaxed">
                  {selected.bodyPreview || selected.bodyFull || 'No preview available'}
                </Text>
              </Card>
            </div>

            <Group gap="xs">
              <ActionButton label="Approve" messageId={selected.id} action="approved" color="green" />
              <ActionButton label="Block Domain" messageId={selected.id} action="blocked" color="red" />
            </Group>
          </Card>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  messageId,
  action,
  color,
}: {
  label: string;
  messageId: string;
  action: string;
  color: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      await fetch(`/api/messages/${messageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      loading={loading}
      variant="light"
      color={color}
      size="xs"
      className="flex-1 font-mono"
    >
      {label}
    </Button>
  );
}
