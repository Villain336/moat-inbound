import { requireAuth } from '@/lib/auth-helpers';
import { getUserById, getConnectedAccounts, getDefenseRules } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/components/dashboard/OnboardingFlow';

export default async function OnboardingPage() {
  const session = await requireAuth();
  const user = await getUserById(session.user.id);

  if (user?.onboardingComplete) {
    redirect('/dashboard');
  }

  const [accounts, rules] = await Promise.all([
    getConnectedAccounts(session.user.id),
    getDefenseRules(session.user.id),
  ]);

  const hasGmail = accounts.some((a) => a.provider === 'gmail');
  const mappedRules = rules.map((r) => ({
    ...r,
    isEnabled: r.isEnabled ?? true,
    isSystem: r.isSystem ?? false,
    timesTriggered: r.timesTriggered ?? 0,
  }));

  return (
    <OnboardingFlow
      userId={session.user.id}
      hasGmail={hasGmail}
      rules={mappedRules}
      currentPosture={(user?.agentPosture as 'passive' | 'defensive' | 'aggressive') || 'defensive'}
    />
  );
}
