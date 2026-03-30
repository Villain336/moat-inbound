'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import type { AgentPosture } from '@/types';

const POSTURES: Array<{
  value: AgentPosture;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'passive',
    label: 'Passive',
    description: 'Classify and log only. No engagement with senders.',
    icon: '👁',
  },
  {
    value: 'defensive',
    label: 'Defensive',
    description:
      'Politely engage senders with qualification questions. Professional and thorough.',
    icon: '🛡',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description:
      'Aggressively qualify. Ask pointed questions. Waste time of confirmed automated senders.',
    icon: '⚔',
  },
];

const CAPABILITIES = [
  {
    key: 'agent_negotiation',
    label: 'Agent-to-Agent Negotiation',
    description: 'Detect and engage other AI agents in qualification dialog',
  },
  {
    key: 'fingerprinting',
    label: 'Linguistic Fingerprinting',
    description: 'Analyze writing patterns to detect AI-generated content',
  },
  {
    key: 'tool_detection',
    label: 'Tool Signature Detection',
    description: 'Identify which sales tools sent the message via headers and patterns',
  },
  {
    key: 'cross_reference',
    label: 'Cross-Reference Verification',
    description: 'Verify sender claims against LinkedIn and public data',
  },
  {
    key: 'auto_unsubscribe',
    label: 'Auto-Unsubscribe',
    description: 'Automatically unsubscribe from detected sequences',
  },
  {
    key: 'honeypot',
    label: 'Honeypot Engagement',
    description: 'Extended engagement to waste automated sender resources',
  },
];

export function AgentConfigPage({
  agentPosture,
  capabilities,
  qualificationQuestions,
}: {
  agentPosture: AgentPosture;
  capabilities: Record<string, boolean>;
  qualificationQuestions: string[];
}) {
  const router = useRouter();
  const [posture, setPosture] = useState(agentPosture);
  const [caps, setCaps] = useState(capabilities);
  const [questions, setQuestions] = useState(qualificationQuestions);
  const [newQuestion, setNewQuestion] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/agent/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentPosture: posture,
          capabilities: caps,
          qualificationQuestions: questions,
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const toggleCap = (key: string) => {
    setCaps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setQuestions((prev) => [...prev, newQuestion.trim()]);
    setNewQuestion('');
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">
            Agent Configuration
          </h1>
          <p className="text-white/40 font-mono text-xs mt-1">
            CONFIGURE YOUR AI DEFENSE AGENT
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-moat-blue/20 text-moat-blue font-medium text-sm border border-moat-blue/30 hover:bg-moat-blue/30 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Agent Posture */}
      <div>
        <h2 className="font-mono text-[10px] text-white/40 tracking-widest mb-3">
          AGENT POSTURE
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {POSTURES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPosture(p.value)}
              className={clsx(
                'p-4 rounded-xl border text-left transition-all',
                posture === p.value
                  ? 'border-moat-blue/40 bg-moat-blue/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
              )}
            >
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="font-display font-semibold text-sm mb-1">
                {p.label}
              </div>
              <div className="text-white/40 text-xs leading-relaxed">
                {p.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <h2 className="font-mono text-[10px] text-white/40 tracking-widest mb-3">
          CAPABILITIES
        </h2>
        <div className="space-y-2">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.key}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              <button
                onClick={() => toggleCap(cap.key)}
                className={clsx(
                  'w-10 h-5 rounded-full transition-colors relative shrink-0',
                  caps[cap.key] ? 'bg-moat-green/30' : 'bg-white/10'
                )}
              >
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full absolute top-0.5 transition-all',
                    caps[cap.key]
                      ? 'left-[22px] bg-moat-green shadow-[0_0_8px_rgba(52,199,89,0.5)]'
                      : 'left-0.5 bg-white/40'
                  )}
                />
              </button>
              <div className="flex-1">
                <div className="text-sm font-medium">{cap.label}</div>
                <div className="text-white/35 text-xs mt-0.5">
                  {cap.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Qualification Script */}
      <div>
        <h2 className="font-mono text-[10px] text-white/40 tracking-widest mb-3">
          QUALIFICATION QUESTIONS
        </h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
          {questions.map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04] group"
            >
              <span className="font-mono text-[10px] text-white/20 mt-0.5 w-4 shrink-0">
                {i + 1}.
              </span>
              <span className="text-sm text-white/70 flex-1">{q}</span>
              <button
                onClick={() => removeQuestion(i)}
                className="text-white/0 group-hover:text-white/30 hover:!text-moat-red transition-colors text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
              placeholder="Add a qualification question..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none focus:border-moat-blue/50"
            />
            <button
              onClick={addQuestion}
              className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
