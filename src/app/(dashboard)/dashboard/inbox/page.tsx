import { requireAuth } from '@/lib/auth-helpers';
import { getInboundMessages } from '@/lib/db/queries';
import { InboundFeed } from '@/components/dashboard/InboundFeed';
import type { MessageStatus } from '@/types';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string; selected?: string };
}) {
  const session = await requireAuth();
  const userId = session.user.id;
  const status = searchParams.status as MessageStatus | undefined;
  const page = parseInt(searchParams.page || '1', 10);

  const result = await getInboundMessages(userId, {
    status: status || undefined,
    page,
    limit: 30,
  });

  const messages = result.messages.map((m) => ({
    ...m,
    status: m.status ?? 'pending',
    threatScore: m.threatScore ?? 0,
    aiAnalysis: (m.aiAnalysis as Record<string, unknown>) ?? null,
    matchedRules: (m.matchedRules as string[]) ?? null,
  }));

  return (
    <InboundFeed
      messages={messages}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      currentStatus={status || 'all'}
      selectedId={searchParams.selected}
    />
  );
}
