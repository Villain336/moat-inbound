import { requireAuth } from '@/lib/auth-helpers';
import { getDefenseRules } from '@/lib/db/queries';
import { DefenseRulesPage } from '@/components/dashboard/DefenseRules';

export default async function RulesPage() {
  const session = await requireAuth();
  const rules = await getDefenseRules(session.user.id);

  const mapped = rules.map((r) => ({
    ...r,
    isEnabled: r.isEnabled ?? true,
    isSystem: r.isSystem ?? false,
    timesTriggered: r.timesTriggered ?? 0,
  }));

  return <DefenseRulesPage rules={mapped} />;
}
