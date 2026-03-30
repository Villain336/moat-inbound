'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date | string;
}

interface Conversation {
  id: string;
  status: string;
  outcome: string | null;
  messages: Message[];
}

export function AgentConversationModal({
  conversationId,
  senderName,
  onClose,
}: {
  conversationId: string;
  senderName: string;
  onClose: () => void;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/agent/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((res) => {
        setConversation(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const handleSend = async () => {
    if (!inputVal.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch(
        `/api/agent/conversations/${conversationId}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: inputVal }),
        }
      );
      const data = await res.json();
      if (data.data) {
        setConversation(data.data);
      }
      setInputVal('');
    } finally {
      setSending(false);
    }
  };

  const roleConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    moat_agent: {
      label: 'MOAT AGENT',
      color: 'text-moat-green',
      bgColor: 'bg-white/[0.04]',
      borderColor: 'border-white/[0.06]',
    },
    inbound_agent: {
      label: 'INBOUND',
      color: 'text-moat-orange',
      bgColor: 'bg-moat-orange/[0.05]',
      borderColor: 'border-moat-orange/[0.1]',
    },
    user_override: {
      label: 'YOU',
      color: 'text-moat-blue',
      bgColor: 'bg-moat-blue/[0.05]',
      borderColor: 'border-moat-blue/[0.1]',
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#111113] rounded-2xl border border-white/[0.08] flex flex-col max-h-[80vh] shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div>
            <div className="font-display font-semibold text-sm">
              Agent Intercept — {senderName}
            </div>
            <div className="font-mono text-[10px] text-white/35 mt-0.5 tracking-wide">
              moat_defense_agent ↔ inbound_agent
              {conversation?.status === 'resolved' && (
                <span className="ml-2 text-moat-green">
                  • {conversation.outcome}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs hover:text-white/60 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-3"
        >
          {loading && (
            <div className="text-center py-8 text-white/20 font-mono text-sm">
              Loading conversation...
            </div>
          )}
          {conversation?.messages.map((msg) => {
            const config = roleConfig[msg.role] || roleConfig.inbound_agent;
            const isAgent = msg.role === 'moat_agent' || msg.role === 'user_override';

            return (
              <div
                key={msg.id}
                className={clsx('max-w-[85%]', isAgent ? 'ml-auto' : '')}
              >
                <div
                  className={clsx(
                    'font-mono text-[10px] font-semibold tracking-wider mb-1',
                    config.color
                  )}
                >
                  {config.label}
                </div>
                <div
                  className={clsx(
                    'px-4 py-3 rounded-xl text-sm leading-relaxed text-white/80 border',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        {conversation?.status === 'active' && (
          <div className="px-5 py-3 border-t border-white/[0.06] flex gap-2 shrink-0">
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Override agent directive..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-white/20"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm font-medium hover:bg-white/[0.1] transition-colors disabled:opacity-50"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
