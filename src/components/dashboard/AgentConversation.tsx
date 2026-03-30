'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Modal, Text, TextInput, Button, Group, Badge } from '@mantine/core';

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
      .then((res) => { setConversation(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversation?.messages]);

  const handleSend = async () => {
    if (!inputVal.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/agent/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputVal }),
      });
      const data = await res.json();
      if (data.data) setConversation(data.data);
      setInputVal('');
    } finally {
      setSending(false);
    }
  };

  const roleConfig: Record<string, { label: string; color: string }> = {
    moat_agent: { label: 'MOAT AGENT', color: 'green' },
    inbound_agent: { label: 'INBOUND', color: 'orange' },
    user_override: { label: 'YOU', color: 'blue' },
  };

  return (
    <Modal
      opened
      onClose={onClose}
      size="lg"
      radius="lg"
      centered
      title={
        <div>
          <Text fw={600} className="font-display">
            Agent Intercept {'\u2014'} {senderName}
          </Text>
          <Group gap="xs" className="mt-1">
            <Text size="xs" c="dimmed" className="font-mono">
              moat_defense_agent {'\u2194'} inbound_agent
            </Text>
            {conversation?.status === 'resolved' && (
              <Badge variant="light" color="green" size="xs">
                {conversation.outcome}
              </Badge>
            )}
          </Group>
        </div>
      }
    >
      <div ref={scrollRef} className="max-h-96 overflow-y-auto space-y-3 mb-4">
        {loading && (
          <Text size="sm" c="dimmed" className="font-mono text-center py-8">
            Loading conversation...
          </Text>
        )}
        {conversation?.messages.map((msg) => {
          const config = roleConfig[msg.role] || roleConfig.inbound_agent;
          const isAgent = msg.role === 'moat_agent' || msg.role === 'user_override';
          return (
            <div key={msg.id} className={clsx('max-w-[85%]', isAgent ? 'ml-auto' : '')}>
              <Badge variant="transparent" color={config.color} size="xs" className="font-mono mb-1">
                {config.label}
              </Badge>
              <div className={clsx(
                'px-4 py-3 rounded-xl text-sm leading-relaxed border',
                isAgent
                  ? 'bg-moat-surface border-moat-border'
                  : 'bg-moat-yellow/5 border-moat-yellow/20'
              )}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {conversation?.status === 'active' && (
        <Group gap="xs">
          <TextInput
            flex={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Override agent directive..."
            size="sm"
          />
          <Button onClick={handleSend} loading={sending} variant="default" size="sm" className="shadow-metallic">
            Send
          </Button>
        </Group>
      )}
    </Modal>
  );
}
