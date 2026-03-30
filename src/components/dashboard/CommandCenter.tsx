'use client';

import Link from 'next/link';
import { Card, Title, Text, Group, SimpleGrid, Badge } from '@mantine/core';
import { ThreatBadge, StatusPill, ToolTag } from '@/components/ui/badges';

interface Stats {
  blockedToday: number;
  interceptedToday: number;
  approvedToday: number;
  agentConversations: number;
  toolsDetected: Record<string, number>;
  weeklyTrend: Array<{
    day: string;
    blocked: number;
    intercepted: number;
    approved: number;
  }>;
}

interface Message {
  id: string;
  senderName: string | null;
  senderCompany: string | null;
  subject: string | null;
  threatScore: number | null;
  status: string;
  toolDetected: string | null;
  receivedAt: Date;
}

export function CommandCenter({
  stats,
  latestIntercepts,
}: {
  stats: Stats;
  latestIntercepts: Message[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <Title order={2} className="font-display tracking-tight">
          Command Center
        </Title>
        <Text size="xs" c="dimmed" className="font-mono tracking-widest mt-1">
          REAL-TIME DEFENSE STATUS
        </Text>
      </div>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
        <StatCard label="Blocked" value={stats.blockedToday} color="red" />
        <StatCard label="Intercepted" value={stats.interceptedToday} color="orange" />
        <StatCard label="Approved" value={stats.approvedToday} color="green" />
        <StatCard label="Agent Convos" value={stats.agentConversations} color="blue" />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        {/* Weekly Trend */}
        <Card
          padding="lg"
          radius="lg"
          className="bg-metallic shadow-card border border-moat-border"
        >
          <Text size="xs" c="dimmed" className="font-mono tracking-widest mb-4">
            WEEKLY VOLUME
          </Text>
          <MiniChart data={stats.weeklyTrend} />
          <Group gap="lg" className="mt-3">
            <Legend color="bg-moat-danger" label="Blocked" />
            <Legend color="bg-moat-warning" label="Intercepted" />
            <Legend color="bg-moat-success" label="Approved" />
          </Group>
        </Card>

        {/* Tools Detected */}
        <Card
          padding="lg"
          radius="lg"
          className="bg-metallic shadow-card border border-moat-border"
        >
          <Text size="xs" c="dimmed" className="font-mono tracking-widest mb-4">
            OUTREACH TOOLS DETECTED
          </Text>
          <div className="space-y-2.5">
            {Object.entries(stats.toolsDetected)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([tool, count]) => {
                const maxCount = Math.max(...Object.values(stats.toolsDetected), 1);
                return (
                  <div key={tool} className="flex items-center gap-3">
                    <Text size="xs" className="font-mono text-moat-silver-dark w-28 truncate">
                      {tool}
                    </Text>
                    <div className="flex-1 h-2 rounded-full bg-moat-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-moat-yellow transition-all duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <Text size="xs" c="dimmed" className="font-mono w-8 text-right">
                      {count}
                    </Text>
                  </div>
                );
              })}
            {Object.keys(stats.toolsDetected).length === 0 && (
              <Text size="sm" c="dimmed" className="font-mono">
                No tools detected yet
              </Text>
            )}
          </div>
        </Card>
      </SimpleGrid>

      {/* Latest Intercepts */}
      <Card
        padding="lg"
        radius="lg"
        className="bg-metallic shadow-card border border-moat-border"
      >
        <Group justify="space-between" className="mb-4">
          <Text size="xs" c="dimmed" className="font-mono tracking-widest">
            LATEST INTERCEPTS
          </Text>
          <Text
            component={Link}
            href="/dashboard/inbox"
            size="xs"
            className="font-mono text-moat-info hover:underline"
          >
            View All {'\u2192'}
          </Text>
        </Group>
        <div className="space-y-1.5">
          {latestIntercepts.map((msg) => (
            <Link
              key={msg.id}
              href={`/dashboard/inbox?selected=${msg.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Group gap="xs">
                  <Text size="sm" fw={500} truncate>
                    {msg.senderName || 'Unknown'}
                  </Text>
                  {msg.senderCompany && (
                    <Text size="xs" c="dimmed" className="font-mono" truncate>
                      {msg.senderCompany}
                    </Text>
                  )}
                </Group>
                <Text size="xs" c="dimmed" truncate className="mt-0.5">
                  {msg.subject}
                </Text>
              </div>
              <Group gap="xs" wrap="nowrap">
                <ToolTag tool={msg.toolDetected} />
                <ThreatBadge score={msg.threatScore ?? 0} />
                <StatusPill status={msg.status} />
              </Group>
            </Link>
          ))}
          {latestIntercepts.length === 0 && (
            <Text size="sm" c="dimmed" className="font-mono text-center py-8">
              No intercepts yet. Connect your inbox to start defending.
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card
      padding="lg"
      radius="lg"
      className="bg-metallic shadow-card border border-moat-border"
    >
      <Text size="xs" c="dimmed" className="font-mono tracking-widest mb-2">
        {label.toUpperCase()}
      </Text>
      <Text fw={800} className="text-3xl font-display">
        <Badge variant="transparent" color={color} size="xl" className="text-3xl font-display font-bold p-0">
          {value}
        </Badge>
      </Text>
    </Card>
  );
}

function MiniChart({
  data,
}: {
  data: Array<{ day: string; blocked: number; intercepted: number; approved: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center">
        <Text size="xs" c="dimmed" className="font-mono">No data yet</Text>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => d.blocked + d.intercepted + d.approved),
    1
  );

  return (
    <div className="flex items-end gap-1.5 h-20 px-1">
      {data.map((d, i) => {
        const total = d.blocked + d.intercepted + d.approved;
        const h = (total / maxVal) * 70;
        const bH = total > 0 ? (d.blocked / total) * h : 0;
        const iH = total > 0 ? (d.intercepted / total) * h : 0;
        const aH = total > 0 ? (d.approved / total) * h : 0;

        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="flex flex-col w-full rounded overflow-hidden">
              <div className="bg-moat-danger/70 transition-all duration-500" style={{ height: bH }} />
              <div className="bg-moat-warning/70 transition-all duration-500" style={{ height: iH }} />
              <div className="bg-moat-success/70 transition-all duration-500" style={{ height: aH }} />
            </div>
            <Text size="xs" c="dimmed" className="font-mono text-[9px]">
              {d.day}
            </Text>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-sm ${color} opacity-70`} />
      <Text size="xs" c="dimmed" className="font-mono text-[9px]">{label}</Text>
    </div>
  );
}
