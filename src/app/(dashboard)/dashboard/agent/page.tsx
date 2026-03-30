import { requireAuth } from '@/lib/auth-helpers';
import { getUserPreferences } from '@/lib/db/queries';
import { AgentConfigPage } from '@/components/dashboard/AgentConfig';

export default async function AgentPage() {
  const session = await requireAuth();
  const prefs = await getUserPreferences(session.user.id);

  return (
    <AgentConfigPage
      agentPosture={prefs?.agentPosture || 'defensive'}
      capabilities={prefs?.capabilities || {}}
      qualificationQuestions={prefs?.qualificationQuestions || []}
    />
  );
}
