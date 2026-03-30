import { Badge } from '@mantine/core';

export function ThreatBadge({ score }: { score: number }) {
  const isHigh = score >= 80;
  const isMed = score >= 40;
  const label = isHigh ? 'HIGH' : isMed ? 'MED' : 'LOW';
  const color = isHigh ? 'red' : isMed ? 'orange' : 'green';

  return (
    <Badge
      variant="light"
      color={color}
      size="sm"
      radius="sm"
      className="font-mono font-semibold tracking-wide"
    >
      {score} {'\u2014'} {label}
    </Badge>
  );
}

export function StatusPill({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    blocked: { color: 'red', label: 'BLOCKED' },
    intercepted: { color: 'orange', label: 'INTERCEPTED' },
    approved: { color: 'green', label: 'APPROVED' },
    agent_handling: { color: 'blue', label: 'AGENT' },
    pending: { color: 'gray', label: 'PENDING' },
    quarantined: { color: 'violet', label: 'QUARANTINED' },
  };

  const c = config[status] || config.pending;

  return (
    <Badge
      variant="light"
      color={c.color}
      size="xs"
      radius="sm"
      className="font-mono font-semibold tracking-widest"
    >
      {c.label}
    </Badge>
  );
}

export function ToolTag({ tool }: { tool: string | null }) {
  if (!tool) return null;
  return (
    <Badge
      variant="light"
      color="violet"
      size="xs"
      radius="sm"
      className="font-mono"
      leftSection={<span className="text-[10px]">{'\u26A1'}</span>}
    >
      {tool}
    </Badge>
  );
}

export function ChannelIcon({ channel }: { channel: string }) {
  const icons: Record<string, string> = {
    email: '\u2709',
    linkedin: 'in',
    twitter: 'X',
    sms: '\u2706',
    phone: '\u260E',
  };

  return (
    <div className="w-7 h-7 rounded-md inline-flex items-center justify-center text-[13px] bg-moat-surface border border-moat-border font-bold text-moat-silver-dark font-mono">
      {icons[channel] || '?'}
    </div>
  );
}
