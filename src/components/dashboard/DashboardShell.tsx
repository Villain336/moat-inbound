'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { clsx } from 'clsx';
import {
  Text,
  UnstyledButton,
  Avatar,
  Divider,
} from '@mantine/core';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Command Center', icon: '\u25C9' },
  { href: '/dashboard/inbox', label: 'Inbound Feed', icon: '\u2709' },
  { href: '/dashboard/rules', label: 'Defense Rules', icon: '\u2699' },
  { href: '/dashboard/lists', label: 'Allow / Block', icon: '\u25CE' },
  { href: '/dashboard/agent', label: 'Agent Config', icon: '\u2694' },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-60 bg-moat-surface border-r border-moat-border flex flex-col transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-5 border-b border-moat-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-moat-black flex items-center justify-center text-moat-yellow text-lg font-extrabold shadow-sm">
              M
            </div>
            <div>
              <Text fw={700} size="sm" className="font-display tracking-tight">
                MOAT
              </Text>
              <Text size="xs" c="dimmed" className="font-mono tracking-[0.12em]">
                DEFENSE ACTIVE
              </Text>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-moat-success shadow-[0_0_6px_rgba(22,163,74,0.5)] animate-pulse" />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <UnstyledButton
                key={item.href}
                component={Link}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full',
                  isActive
                    ? 'bg-moat-yellow/15 text-moat-black border border-moat-yellow/30 shadow-sm'
                    : 'text-moat-silver-dark hover:text-moat-black hover:bg-moat-border/50'
                )}
              >
                <span className="text-base font-mono">{item.icon}</span>
                <span className="font-display">{item.label}</span>
              </UnstyledButton>
            );
          })}
        </nav>

        <Divider color="var(--moat-border)" />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={user.image}
              alt={user.name || ''}
              size="sm"
              radius="xl"
              color="dark"
            >
              {user.name?.[0] || user.email?.[0] || '?'}
            </Avatar>
            <div className="flex-1 min-w-0">
              <Text size="xs" fw={500} truncate>
                {user.name}
              </Text>
              <Text size="xs" c="dimmed" truncate className="font-mono">
                {user.email}
              </Text>
            </div>
            <UnstyledButton
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-moat-silver-dark hover:text-moat-black text-xs"
              title="Sign out"
            >
              {'\u2192'}
            </UnstyledButton>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-moat-border bg-moat-surface">
          <UnstyledButton
            onClick={() => setSidebarOpen(true)}
            className="text-moat-black"
          >
            {'\u2630'}
          </UnstyledButton>
          <Text fw={700} size="sm" className="font-display">MOAT</Text>
          <div className="w-2 h-2 rounded-full bg-moat-success animate-pulse" />
        </div>

        <div className="p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
