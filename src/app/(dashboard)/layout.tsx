import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-helpers';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
