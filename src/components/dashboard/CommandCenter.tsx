'use client';

import Link from 'next/link';
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
  const totalToday =
    stats.blockedToday + stats.interceptedToday + stats.approvedToday;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Command Center
        </h1>
        <p className="text-white/40 font-mono text-xs mt-1 tracking-wide">
          REAL-TIME DEFENSE STATUS
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Blocked"
          value={stats.blockedToday}
          color="text-moat-red"
          bgColor="bg-moat-red/10"
          borderColor="border-moat-red/20"
        />
        <StatCard
          label="Intercepted"
          value={stats.interceptedToday}
          color="text-moat-orange"
          bgColor="bg-moat-orange/10"
          borderColor="border-moat-orange/20"
        />
        <StatCard
          label="Approved"
          value={stats.approvedToday}
          color="text-moat-green"
          bgColor="bg-moat-green/10"
          borderColor="border-moat-green/20"
        />
        <StatCard
          label="Agent Convos"
          value={stats.agentConversations}
          color="text-moat-blue"
          bgColor="bg-moat-blue/10"
          borderColor="border-moat-blue/20"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Weekly Trend */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="font-mono text-[10px] text-white/40 tracking-widest mb-4">
            WEEKLY VOLUME
          </h3>
          <MiniChart data={stats.weeklyTrend} />
          <div className="flex gap-4 mt-3">
            <Legend color="bg-moat-red" label="Blocked" />
            <Legend color="bg-moat-orange" label="Intercepted" />
            <Legend color="bg-moat-green" label="Approved" />
          </div>
        </div>

        {/* Tools Detected */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="font-mono text-[10px] text-white/40 tracking-widest mb-4">
            OUTREACH TOOLS DETECTED
          </h3>
          <div className="space-y-2.5">
            {Object.entries(stats.toolsDetected)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([tool, count]) => {
                const maxCount = Math.max(
                  ...Object.values(stats.toolsDetected),
                  1
                );
                return (
                  <div key={tool} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-white/60 w-28 truncate">
                      {tool}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-moat-purple/70 transition-all duration-500"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-white/40 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            {Object.keys(stats.toolsDetected).length === 0 && (
              <p className="text-white/20 text-sm font-mono">
                No tools detected yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Latest Intercepts */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-[10px] text-white/40 tracking-widest">
            LATEST INTERCEPTS
          </h3>
          <Link
            href="/dashboard/inbox"
            className="text-moat-blue text-xs font-mono hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="space-y-2">
          {latestIntercepts.map((msg) => (
            <Link
              key={msg.id}
              href={`/dashboard/inbox?selected=${msg.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {msg.senderName || 'Unknown'}
                  </span>
                  {msg.senderCompany && (
                    <span className="text-white/30 text-xs font-mono truncate">
                      {msg.senderCompany}
                    </span>
                  )}
                </div>
                <div className="text-white/40 text-xs truncate mt-0.5">
                  {msg.subject}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ToolTag tool={msg.toolDetected} />
                <ThreatBadge score={msg.threatScore ?? 0} />
                <StatusPill status={msg.status} />
              </div>
            </Link>
          ))}
          {latestIntercepts.length === 0 && (
            <p className="text-white/20 text-sm font-mono text-center py-8">
              No intercepts yet. Connect your inbox to start defending.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bgColor,
  borderColor,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      className={`rounded-xl border ${borderColor} ${bgColor} p-4`}
    >
      <div className="font-mono text-[10px] text-white/40 tracking-widest mb-2">
        {label.toUpperCase()}
      </div>
      <div className={`text-3xl font-bold font-display ${color}`}>
        {value}
      </div>
    </div>
  );
}

function MiniChart({
  data,
}: {
  data: Array<{ day: string; blocked: number; intercepted: number; approved: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-white/20 font-mono text-xs">
        No data yet
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
          <div
            key={i}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div className="flex flex-col w-full rounded overflow-hidden">
              <div
                className="bg-moat-red/70 transition-all duration-500"
                style={{ height: bH }}
              />
              <div
                className="bg-moat-orange/70 transition-all duration-500"
                style={{ height: iH }}
              />
              <div
                className="bg-moat-green/70 transition-all duration-500"
                style={{ height: aH }}
              />
            </div>
            <span className="text-[9px] text-white/35 font-mono">
              {d.day}
            </span>
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
      <span className="font-mono text-[9px] text-white/35">{label}</span>
    </div>
  );
}
