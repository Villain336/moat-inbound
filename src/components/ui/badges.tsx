import { clsx } from 'clsx';

export function ThreatBadge({ score }: { score: number }) {
  const isHigh = score >= 80;
  const isMed = score >= 40;
  const label = isHigh ? 'HIGH' : isMed ? 'MED' : 'LOW';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold tracking-wide border',
        isHigh && 'bg-moat-red/10 text-moat-red border-moat-red/20',
        !isHigh && isMed && 'bg-moat-orange/10 text-moat-orange border-moat-orange/20',
        !isMed && 'bg-moat-green/10 text-moat-green border-moat-green/20'
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full',
          isHigh && 'bg-moat-red shadow-[0_0_6px_rgba(255,59,48,0.5)]',
          !isHigh && isMed && 'bg-moat-orange shadow-[0_0_6px_rgba(255,149,0,0.5)]',
          !isMed && 'bg-moat-green shadow-[0_0_6px_rgba(52,199,89,0.5)]'
        )}
      />
      {score} — {label}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const config: Record<string, { classes: string; label: string }> = {
    blocked: {
      classes: 'bg-moat-red/10 text-moat-red border-moat-red/20',
      label: 'BLOCKED',
    },
    intercepted: {
      classes: 'bg-moat-orange/10 text-moat-orange border-moat-orange/20',
      label: 'INTERCEPTED',
    },
    approved: {
      classes: 'bg-moat-green/10 text-moat-green border-moat-green/20',
      label: 'APPROVED',
    },
    agent_handling: {
      classes: 'bg-moat-blue/10 text-moat-blue border-moat-blue/20',
      label: 'AGENT HANDLING',
    },
    pending: {
      classes: 'bg-white/5 text-white/40 border-white/10',
      label: 'PENDING',
    },
    quarantined: {
      classes: 'bg-moat-purple/10 text-moat-purple border-moat-purple/20',
      label: 'QUARANTINED',
    },
  };

  const c = config[status] || config.pending;

  return (
    <span
      className={clsx(
        'px-2.5 py-0.5 rounded font-mono text-[10px] font-semibold tracking-widest border',
        c.classes
      )}
    >
      {c.label}
    </span>
  );
}

export function ToolTag({ tool }: { tool: string | null }) {
  if (!tool) return null;
  return (
    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-medium bg-moat-purple/10 text-purple-400 border border-moat-purple/20 tracking-wide">
      ⚡ {tool}
    </span>
  );
}

export function ChannelIcon({ channel }: { channel: string }) {
  const icons: Record<string, string> = {
    email: '✉',
    linkedin: 'in',
    twitter: '𝕏',
  };

  return (
    <span className="w-7 h-7 rounded-md inline-flex items-center justify-center text-[13px] bg-white/[0.04] border border-white/[0.08] font-bold text-white/50">
      {icons[channel] || '?'}
    </span>
  );
}
