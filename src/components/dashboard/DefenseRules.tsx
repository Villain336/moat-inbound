'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

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
  hard_block: { color: 'text-moat-red', label: 'HARD BLOCK' },
  intercept: { color: 'text-moat-orange', label: 'INTERCEPT' },
  qualify: { color: 'text-moat-blue', label: 'QUALIFY' },
  delay: { color: 'text-moat-purple', label: 'DELAY' },
  approve: { color: 'text-moat-green', label: 'APPROVE' },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">
            Defense Rules
          </h1>
          <p className="text-white/40 font-mono text-xs mt-1">
            {rules.length} RULES CONFIGURED
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm font-medium hover:bg-white/[0.1] transition-colors"
        >
          + Add Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => {
          const sev = SEVERITY_CONFIG[rule.severity] || SEVERITY_CONFIG.intercept;
          return (
            <div
              key={rule.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
            >
              {/* Toggle */}
              <button
                onClick={() => handleToggle(rule.id)}
                className={clsx(
                  'w-10 h-5 rounded-full transition-colors relative shrink-0',
                  rule.isEnabled ? 'bg-moat-green/30' : 'bg-white/10'
                )}
              >
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full absolute top-0.5 transition-all',
                    rule.isEnabled
                      ? 'left-5.5 bg-moat-green shadow-[0_0_8px_rgba(52,199,89,0.5)] left-[22px]'
                      : 'left-0.5 bg-white/40'
                  )}
                />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{rule.name}</span>
                  {rule.isSystem && (
                    <span className="text-[9px] font-mono text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded">
                      SYSTEM
                    </span>
                  )}
                </div>
                {rule.description && (
                  <div className="text-white/35 text-xs mt-0.5">
                    {rule.description}
                  </div>
                )}
              </div>

              <span
                className={clsx(
                  'font-mono text-[10px] font-semibold tracking-widest',
                  sev.color
                )}
              >
                {sev.label}
              </span>

              <span className="font-mono text-[11px] text-white/30 w-16 text-right">
                {rule.timesTriggered}x
              </span>

              {!rule.isSystem && (
                <button
                  onClick={async () => {
                    await fetch(`/api/rules/${rule.id}`, { method: 'DELETE' });
                    router.refresh();
                  }}
                  className="text-white/20 hover:text-moat-red text-xs transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <AddRuleForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AddRuleForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('intercept');
  const [conditionType, setConditionType] = useState('body_contains_any');
  const [conditionValues, setConditionValues] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const conditions: Record<string, unknown> = { type: conditionType };
    if (['body_contains_any', 'header_match', 'sender_domain_in', 'classification_is'].includes(conditionType)) {
      conditions.values = conditionValues.split(',').map((v) => v.trim()).filter(Boolean);
    }
    if (['threat_score_above', 'ai_patterns_score', 'spam_score_above'].includes(conditionType)) {
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#111113] rounded-2xl border border-white/[0.08] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">New Rule</h3>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white/60">
            ✕
          </button>
        </div>

        <div>
          <label className="block font-mono text-[10px] text-white/40 tracking-widest mb-1">
            NAME
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none focus:border-moat-blue/50"
          />
        </div>

        <div>
          <label className="block font-mono text-[10px] text-white/40 tracking-widest mb-1">
            DESCRIPTION
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none focus:border-moat-blue/50"
          />
        </div>

        <div>
          <label className="block font-mono text-[10px] text-white/40 tracking-widest mb-1">
            SEVERITY
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="hard_block">Hard Block</option>
            <option value="intercept">Intercept</option>
            <option value="qualify">Qualify</option>
            <option value="delay">Delay</option>
            <option value="approve">Approve</option>
          </select>
        </div>

        <div>
          <label className="block font-mono text-[10px] text-white/40 tracking-widest mb-1">
            CONDITION TYPE
          </label>
          <select
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="body_contains_any">Body Contains Any</option>
            <option value="header_match">Header Match</option>
            <option value="sender_domain_in">Sender Domain In</option>
            <option value="classification_is">Classification Is</option>
            <option value="threat_score_above">Threat Score Above</option>
            <option value="ai_patterns_score">AI Patterns Score</option>
          </select>
        </div>

        <div>
          <label className="block font-mono text-[10px] text-white/40 tracking-widest mb-1">
            VALUES (comma-separated or threshold number)
          </label>
          <input
            value={conditionValues}
            onChange={(e) => setConditionValues(e.target.value)}
            required
            placeholder="e.g. apollo, clay, outreach"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none focus:border-moat-blue/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-moat-blue/20 text-moat-blue font-medium text-sm border border-moat-blue/30 hover:bg-moat-blue/30 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Rule'}
        </button>
      </form>
    </div>
  );
}
