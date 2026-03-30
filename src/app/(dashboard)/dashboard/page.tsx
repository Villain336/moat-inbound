import { requireAuth } from '@/lib/auth-helpers';
import { getDailyStats, getInboundMessages } from '@/lib/db/queries';
import { CommandCenter } from '@/components/dashboard/CommandCenter';

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [weeklyStats, recentMessages] = await Promise.all([
    getDailyStats(userId, { since: weekAgo, until: now }),
    getInboundMessages(userId, { limit: 10 }),
  ]);

  // Compute today's stats from the weekly data
  const todayStats = weeklyStats.find(
    (s) => new Date(s.date).toDateString() === todayStart.toDateString()
  );

  const stats = {
    blockedToday: todayStats?.blocked ?? 0,
    interceptedToday: todayStats?.intercepted ?? 0,
    approvedToday: todayStats?.approved ?? 0,
    agentConversations: todayStats?.agentConversations ?? 0,
    toolsDetected: (todayStats?.toolsDetected as Record<string, number>) ?? {},
    weeklyTrend: weeklyStats.map((s) => ({
      day: new Date(s.date).toLocaleDateString('en', { weekday: 'short' }),
      blocked: s.blocked ?? 0,
      intercepted: s.intercepted ?? 0,
      approved: s.approved ?? 0,
    })),
  };

  const latestIntercepts = recentMessages.messages
    .filter((m) => m.status !== 'approved')
    .slice(0, 5)
    .map((m) => ({
      ...m,
      status: m.status ?? 'pending',
      threatScore: m.threatScore ?? 0,
    }));

  return <CommandCenter stats={stats} latestIntercepts={latestIntercepts} />;
}
