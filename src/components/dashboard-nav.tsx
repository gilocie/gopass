
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Palette,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/events', icon: Calendar, label: 'Events' },
  { href: '/dashboard/designer', icon: Palette, label: 'Ticket Designer' },
  { href: '/verify', icon: QrCode, label: 'QR Verification' },
];

export default function DashboardNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path;
    if (path === '/verify') return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            {navItems.map((item) => (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                    <Link
                        href={item.href}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                            isActive(item.href) && "bg-accent text-accent-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
            ))}
        </nav>
    </TooltipProvider>
  );
}
