
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Home, Users, Calendar, Building, Settings } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ClientLoader } from '@/components/client-loader';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/dashboard/admin', icon: Home, label: 'Overview' },
  { href: '/dashboard/admin/users', icon: Users, label: 'Users' },
  { href: '/dashboard/admin/events', icon: Calendar, label: 'Events' },
  { href: '/dashboard/admin/organizers', icon: Building, label: 'Organizers' },
  { href: '/dashboard/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading } = useAdminAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return path === '/dashboard/admin' ? pathname === path : pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <ClientLoader />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // The hook will handle redirection
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard/admin" className="flex items-center gap-2 font-semibold">
              <Shield className="h-6 w-6 text-primary" />
              <span>Admin Panel</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {adminNavItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      isActive(item.href) && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {/* Mobile Header could be added here if needed */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
