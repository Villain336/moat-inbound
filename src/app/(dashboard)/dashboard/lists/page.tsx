import { requireAuth } from '@/lib/auth-helpers';
import { getAllowlist, getBlocklist } from '@/lib/db/queries';
import { AllowBlockLists } from '@/components/dashboard/AllowBlockLists';

export default async function ListsPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [allowlistEntries, blocklistEntries] = await Promise.all([
    getAllowlist(userId),
    getBlocklist(userId),
  ]);

  return (
    <AllowBlockLists
      allowlist={allowlistEntries}
      blocklist={blocklistEntries}
    />
  );
}
