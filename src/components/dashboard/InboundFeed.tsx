'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  ThreatBadge,
  StatusPill,
  ToolTag,
  ChannelIcon,
} from '@/components/ui/badges';
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

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'intercepted', label: 'Intercepted' },
  { value: 'agent_handling', label: 'Agent' },
  { value: 'approved', label: 'Approved' },
];

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
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Inbound Feed
        </h1>
        <p className="text-white/40 font-mono text-xs mt-1">
          {total} MESSAGES PROCESSED
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-white/[0.02] rounded-lg p-1 border border-white/[0.06] w-fit">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/inbox${tab.value !== 'all' ? `?status=${tab.value}` : ''}`}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors',
              currentStatus === tab.value
                ? 'bg-white/[0.08] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Message List */}
        <div className="flex-1 space-y-1">
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => setSelected(msg)}
              className={clsx(
                'w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors',
                selected?.id === msg.id
                  ? 'bg-white/[0.06] border border-white/[0.08]'
                  : 'hover:bg-white/[0.03] border border-transparent'
              )}
            >
              <ChannelIcon channel={msg.channel} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {msg.senderName || msg.senderEmail || 'Unknown'}
                  </span>
                  {msg.senderCompany && (
                    <span className="text-white/25 text-[11px] font-mono truncate hidden sm:inline">
                      {msg.senderCompany}
                    </span>
                  )}
                </div>
                <div className="text-white/40 text-xs truncate">
                  {msg.subject}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ToolTag tool={msg.toolDetected} />
                <ThreatBadge score={msg.threatScore ?? 0} />
                <StatusPill status={msg.status} />
                <span className="text-white/25 text-[10px] font-mono w-14 text-right hidden md:block">
                  {formatDistanceToNow(new Date(msg.receivedAt), {
                    addSuffix: false,
                  })}
                </span>
              </div>
            </button>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-16 text-white/20 font-mono text-sm">
              No messages found
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {page > 1 && (
                <Link
                  href={`/dashboard/inbox?${currentStatus !== 'all' ? `status=${currentStatus}&` : ''}page=${page - 1}`}
                  className="px-3 py-1.5 rounded-md bg-white/[0.04] text-white/60 text-xs font-mono hover:bg-white/[0.08]"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-3 py-1.5 text-white/30 text-xs font-mono">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/inbox?${currentStatus !== 'all' ? `status=${currentStatus}&` : ''}page=${page + 1}`}
                  className="px-3 py-1.5 rounded-md bg-white/[0.04] text-white/60 text-xs font-mono hover:bg-white/[0.08]"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="hidden lg:block w-96 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sticky top-8 self-start">
            <div className="flex items-center justify-between mb-4">
              <StatusPill status={selected.status} />
              <button
                onClick={() => setSelected(null)}
                className="text-white/30 hover:text-white/60 text-xs"
              >
                ✕
              </button>
            </div>

            <h3 className="font-display font-semibold text-lg mb-1">
              {selected.subject || '(No Subject)'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
              <span>{selected.senderName || selected.senderEmail}</span>
              {selected.senderCompany && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="font-mono text-xs">
                    {selected.senderCompany}
                  </span>
                </>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <ThreatBadge score={selected.threatScore ?? 0} />
              <ToolTag tool={selected.toolDetected} />
            </div>

            {/* AI Analysis */}
            {selected.aiAnalysis && (
              <div className="mb-4">
                <h4 className="font-mono text-[10px] text-white/40 tracking-widest mb-2">
                  AI ANALYSIS
                </h4>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 leading-relaxed">
                  {(selected.aiAnalysis as Record<string, unknown>).reasoning as string ||
                    'No analysis available'}
                </div>
              </div>
            )}

            {/* Message Preview */}
            <div>
              <h4 className="font-mono text-[10px] text-white/40 tracking-widest mb-2">
                MESSAGE PREVIEW
              </h4>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 leading-relaxed max-h-48 overflow-y-auto">
                {selected.bodyPreview || selected.bodyFull || 'No preview available'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <ActionButton
                label="Approve"
                messageId={selected.id}
                action="approved"
              />
              <ActionButton
                label="Block Domain"
                messageId={selected.id}
                action="blocked"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  messageId,
  action,
}: {
  label: string;
  messageId: string;
  action: string;
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
    <button
      onClick={handleClick}
      disabled={loading}
      className={clsx(
        'flex-1 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-colors border',
        action === 'approved'
          ? 'bg-moat-green/10 text-moat-green border-moat-green/20 hover:bg-moat-green/20'
          : 'bg-moat-red/10 text-moat-red border-moat-red/20 hover:bg-moat-red/20',
        loading && 'opacity-50'
      )}
    >
      {loading ? '...' : label}
    </button>
  );
}
