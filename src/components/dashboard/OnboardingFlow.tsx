'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { clsx } from 'clsx';

interface Rule {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  isEnabled: boolean;
  isSystem: boolean;
}

const STEPS = [
  { id: 'connect', label: 'Connect Inbox' },
  { id: 'posture', label: 'Agent Posture' },
  { id: 'allowlist', label: 'Seed Allowlist' },
  { id: 'rules', label: 'Review Rules' },
  { id: 'done', label: 'Ready' },
];

const POSTURES = [
  {
    value: 'passive' as const,
    label: 'Passive',
    icon: '👁',
    description: 'Classify and log only. No engagement with senders.',
  },
  {
    value: 'defensive' as const,
    label: 'Defensive',
    icon: '🛡',
    description: 'Politely engage with qualification questions. Professional and thorough.',
  },
  {
    value: 'aggressive' as const,
    label: 'Aggressive',
    icon: '⚔',
    description: 'Aggressively qualify. Waste time of confirmed automated senders.',
  },
];

export function OnboardingFlow({
  userId,
  hasGmail,
  rules,
  currentPosture,
}: {
  userId: string;
  hasGmail: boolean;
  rules: Rule[];
  currentPosture: 'passive' | 'defensive' | 'aggressive';
}) {
  const router = useRouter();
  const [step, setStep] = useState(hasGmail ? 1 : 0);
  const [posture, setPosture] = useState(currentPosture);
  const [allowlistInput, setAllowlistInput] = useState('');
  const [allowlistEntries, setAllowlistEntries] = useState<string[]>([]);
  const [ruleToggles, setRuleToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(rules.map((r) => [r.id, r.isEnabled]))
  );
  const [saving, setSaving] = useState(false);

  const currentStep = STEPS[step];

  const addToAllowlist = () => {
    const items = allowlistInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !allowlistEntries.includes(s));
    if (items.length > 0) {
      setAllowlistEntries((prev) => [...prev, ...items]);
      setAllowlistInput('');
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save posture
      await fetch('/api/agent/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentPosture: posture }),
      });

      // Save allowlist entries
      for (const entry of allowlistEntries) {
        const entryType = entry.includes('@') ? 'email' : 'domain';
        await fetch('/api/allowlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry, entryType }),
        });
      }

      // Toggle rules
      for (const rule of rules) {
        if (ruleToggles[rule.id] !== rule.isEnabled) {
          await fetch(`/api/rules/${rule.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toggle: true }),
          });
        }
      }

      // Mark onboarding complete
      await fetch('/api/agent/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentPosture: posture }),
      });

      router.push('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-colors',
                i < step
                  ? 'bg-moat-green/20 border-moat-green/30 text-moat-green'
                  : i === step
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/20'
              )}
            >
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={clsx(
                  'flex-1 h-px',
                  i < step ? 'bg-moat-green/30' : 'bg-white/[0.06]'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="font-mono text-[10px] text-white/30 tracking-widest mb-2">
        STEP {step + 1} OF {STEPS.length}
      </div>

      {/* Step 0: Connect Gmail */}
      {step === 0 && (
        <div>
          <h2 className="text-2xl font-bold font-display mb-2">
            Connect Your Inbox
          </h2>
          <p className="text-white/40 mb-8">
            Moat needs access to your Gmail to classify and defend your inbox in
            real-time.
          </p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard/onboarding' })}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-medium">Connect Gmail</span>
          </button>
          {hasGmail && (
            <div className="mt-4 p-3 rounded-lg bg-moat-green/10 border border-moat-green/20 text-moat-green text-sm font-mono">
              Gmail connected successfully
            </div>
          )}
        </div>
      )}

      {/* Step 1: Agent Posture */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold font-display mb-2">
            Choose Your Defense Posture
          </h2>
          <p className="text-white/40 mb-8">
            How aggressively should your Moat agent handle suspicious outreach?
          </p>
          <div className="space-y-3">
            {POSTURES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPosture(p.value)}
                className={clsx(
                  'w-full p-5 rounded-xl border text-left transition-all',
                  posture === p.value
                    ? 'border-moat-blue/40 bg-moat-blue/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{p.icon}</span>
                  <div>
                    <div className="font-display font-semibold">{p.label}</div>
                    <div className="text-white/40 text-sm mt-0.5">
                      {p.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Seed Allowlist */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold font-display mb-2">
            Seed Your Allowlist
          </h2>
          <p className="text-white/40 mb-8">
            Add trusted domains and emails that should always pass through.
            Investors, partners, key contacts.
          </p>
          <div className="flex gap-2 mb-4">
            <input
              value={allowlistInput}
              onChange={(e) => setAllowlistInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToAllowlist()}
              placeholder="a16z.com, partner@firm.com (comma-separated)"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm outline-none focus:border-moat-green/40 font-mono"
            />
            <button
              onClick={addToAllowlist}
              className="px-4 py-3 rounded-lg bg-moat-green/15 text-moat-green font-semibold text-sm border border-moat-green/25"
            >
              Add
            </button>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {allowlistEntries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
              >
                <span className="font-mono text-sm text-white/70">{entry}</span>
                <button
                  onClick={() =>
                    setAllowlistEntries((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                  className="text-white/20 hover:text-moat-red text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
            {allowlistEntries.length === 0 && (
              <p className="text-white/20 text-sm font-mono py-4 text-center">
                No entries yet — you can skip this step
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Review Rules */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold font-display mb-2">
            Review Defense Rules
          </h2>
          <p className="text-white/40 mb-8">
            These default rules protect you out of the box. Toggle any you want
            to disable.
          </p>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <button
                  onClick={() =>
                    setRuleToggles((prev) => ({
                      ...prev,
                      [rule.id]: !prev[rule.id],
                    }))
                  }
                  className={clsx(
                    'w-10 h-5 rounded-full transition-colors relative shrink-0',
                    ruleToggles[rule.id] ? 'bg-moat-green/30' : 'bg-white/10'
                  )}
                >
                  <div
                    className={clsx(
                      'w-4 h-4 rounded-full absolute top-0.5 transition-all',
                      ruleToggles[rule.id]
                        ? 'left-[22px] bg-moat-green shadow-[0_0_8px_rgba(52,199,89,0.5)]'
                        : 'left-0.5 bg-white/40'
                    )}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{rule.name}</div>
                  {rule.description && (
                    <div className="text-white/35 text-xs mt-0.5">
                      {rule.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-moat-green to-moat-blue flex items-center justify-center text-4xl font-extrabold mx-auto mb-6 shadow-[0_0_40px_rgba(52,199,89,0.3)]">
            M
          </div>
          <h2 className="text-2xl font-bold font-display mb-2">
            Your Moat is Active
          </h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto">
            Your inbox is now defended. Moat will classify every inbound message
            and your agent is ready to intercept suspicious outreach.
          </p>
          <button
            onClick={handleComplete}
            disabled={saving}
            className="px-10 py-4 rounded-xl bg-gradient-to-r from-moat-green to-moat-blue text-white font-semibold text-lg shadow-[0_0_30px_rgba(52,199,89,0.2)] disabled:opacity-50"
          >
            {saving ? 'Setting up...' : 'Go to Command Center'}
          </button>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="flex justify-between mt-10">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60 disabled:opacity-20"
          >
            ← Back
          </button>
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="px-6 py-2.5 rounded-lg bg-white/[0.08] border border-white/[0.1] text-sm font-medium hover:bg-white/[0.12] transition-colors"
          >
            {step === 3 ? 'Finish Setup' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  );
}
