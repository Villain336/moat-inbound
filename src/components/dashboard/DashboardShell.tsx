'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Command Center', icon: '◉' },
  { href: '/dashboard/inbox', label: 'Inbound Feed', icon: '✉' },
  { href: '/dashboard/rules', label: 'Defense Rules', icon: '⚔' },
  { href: '/dashboard/lists', label: 'Allow / Block', icon: '◎' },
  { href: '/dashboard/agent', label: 'Agent Config', icon: '🤖' },
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
    <div className="min-h-screen bg-moat-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-moat-bg border-r border-white/[0.06] flex flex-col transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-moat-green to-moat-blue flex items-center justify-center text-lg font-extrabold shadow-[0_0_20px_rgba(52,199,89,0.25)]">
              M
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-tight">MOAT</div>
              <div className="font-mono text-[9px] text-white/30 tracking-[0.15em]">
                DEFENSE ACTIVE
              </div>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-moat-green shadow-[0_0_8px_rgba(52,199,89,0.6)] animate-pulse" />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-display">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                {user.name?.[0] || user.email?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-white/30 truncate font-mono">
                {user.email}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-white/30 hover:text-white/60 text-xs"
              title="Sign out"
            >
              ↗
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/[0.06]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white"
          >
            ☰
          </button>
          <div className="font-display font-bold text-sm">MOAT</div>
          <div className="w-2 h-2 rounded-full bg-moat-green animate-pulse" />
        </div>

        <div className="p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
