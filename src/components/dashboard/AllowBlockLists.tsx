'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Allow / Block Lists
        </h1>
        <p className="text-white/40 font-mono text-xs mt-1">
          MANAGE TRUSTED AND BLOCKED SENDERS
        </p>
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

  const borderColor = color === 'green' ? 'border-moat-green/20' : 'border-moat-red/20';
  const accentColor = color === 'green' ? 'text-moat-green' : 'text-moat-red';
  const bgAccent = color === 'green' ? 'bg-moat-green/10' : 'bg-moat-red/10';

  const handleAdd = async () => {
    if (!input.trim()) return;
    setLoading(true);

    // Support comma-separated bulk input
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={`rounded-xl border ${borderColor} bg-white/[0.02] p-5`}>
      <div className="mb-4">
        <h2 className={`font-display font-semibold text-lg ${accentColor}`}>
          {title}
        </h2>
        <p className="text-white/30 text-xs font-mono mt-0.5">{subtitle}</p>
      </div>

      {/* Add Input */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="domain.com or email@domain.com"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20 font-mono"
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className={`px-4 py-2 rounded-lg ${bgAccent} ${accentColor} text-sm font-medium border ${borderColor} hover:opacity-80 transition-opacity disabled:opacity-50`}
        >
          {loading ? '...' : 'Add'}
        </button>
      </div>

      {/* Entries */}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] group"
          >
            <span className="text-sm font-mono flex-1 truncate">
              {entry.entry}
            </span>
            <span className="text-[10px] font-mono text-white/20">
              {entry.entryType}
            </span>
            <span className="text-[10px] font-mono text-white/15">
              {entry.addedBy || 'manual'}
            </span>
            <span className="text-[10px] font-mono text-white/15 w-16 text-right">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: false })}
            </span>
            <button
              onClick={() => handleRemove(entry.id)}
              className="text-white/0 group-hover:text-white/30 hover:!text-moat-red transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-white/15 text-sm font-mono text-center py-6">
            No entries yet
          </p>
        )}
      </div>
    </div>
  );
}
