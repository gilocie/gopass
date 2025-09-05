
'use client';

import Link from 'next/link';
import * as React from 'react';
import {
  PanelLeft,
  Users2,
  Home,
  Calendar,
  LayoutTemplate,
  Store,
  Ticket,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Rocket,
  LayoutDashboard,
  Building,
  Settings,
  DollarSign,
  Wallet
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { PageLoader } from '@/components/page-loader';
import { useAuth } from '@/hooks/use-auth';
import type { Organizer } from '@/lib/types';
import { getOrganizersByUserId } from '@/services/organizerService';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { CurrencyProvider } from '@/contexts/CurrencyContext';


const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/events', icon: Calendar, label: 'My Events' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/dashboard/templates', icon: LayoutTemplate, label: 'Templates' },
  { href: '/dashboard/organization', icon: Building, label: 'My Organization' },
  { href: '/dashboard/transactions', icon: DollarSign, label: 'Transactions' },
  { href: '/events', icon: Store, label: 'Marketplace' },
];

const bottomNavItems = [
    { href: '#', icon: LifeBuoy, label: 'Support' },
]

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
    const [organizers, setOrganizers] = React.useState<Organizer[]>([]);
    const [loadingOrganizers, setLoadingOrganizers] = React.useState(true);

    React.useEffect(() => {
        const fetchUserOrganizers = async () => {
            if (user) {
                try {
                    setLoadingOrganizers(true);
                    const userOrgs = await getOrganizersByUserId(user.uid);
                    setOrganizers(userOrgs);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your organizer profiles.' });
                } finally {
                    setLoadingOrganizers(false);
                }
            } else if (!authLoading) {
                 setLoadingOrganizers(false);
            }
        };
        fetchUserOrganizers();
    }, [user, authLoading, toast]);


    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    }

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname !=='/dashboard') return false;
        if (path === '/') return pathname === path;
        if (path === '/events') return pathname.startsWith('/events');
        return pathname.startsWith(path);
    };

    const currentOrganizer = organizers[0];
    const logoUrl = currentOrganizer?.logoUrl;

  return (
    <CurrencyProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className={cn(
            "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
            isSidebarCollapsed ? "w-14" : "w-56"
        )}>
           <div className="flex h-full max-h-screen flex-col gap-2 relative">
              <div className="flex h-14 items-center justify-center border-b px-4 lg:h-[60px] lg:px-6">
                 <Link
                  href="#"
                  className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base relative"
                  >
                  <Ticket className="h-4 w-4 transition-all group-hover:scale-110" />
                  <span className="sr-only">GoPass</span>
                  </Link>
              </div>
              <TooltipProvider>
                  <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-2 text-sm font-medium">
                      {navItems.map((item) => (
                          <Tooltip key={item.href}>
                              <TooltipTrigger asChild>
                              <Link
                                  href={item.href}
                                  className={cn(
                                      "flex h-9 w-full items-center justify-start gap-4 rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 my-2",
                                      isSidebarCollapsed ? "w-9 justify-center" : "px-3",
                                      isActive(item.href) && "bg-accent text-accent-foreground"
                                  )}
                              >
                                  <item.icon className={cn("h-5 w-5 shrink-0")} />
                                  <span className={cn("truncate", isSidebarCollapsed && "sr-only")}>{item.label}</span>
                              </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right">{item.label}</TooltipContent>
                          </Tooltip>
                      ))}
                  </nav>
                  <nav className="mt-auto border-t px-2 py-4">
                      {bottomNavItems.map((item) => (
                          <Tooltip key={item.href}>
                              <TooltipTrigger asChild>
                              <Link
                                  href={item.href}
                                  className={cn(
                                      "flex h-9 w-full items-center justify-start gap-4 rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8",
                                      isSidebarCollapsed ? "w-9 justify-center" : "px-3",
                                      isActive(item.href) && "bg-accent text-accent-foreground"
                                  )}
                              >
                                  <item.icon className={cn("h-5 w-5 shrink-0")} />
                                  <span className={cn(isSidebarCollapsed && "sr-only")}>{item.label}</span>
                              </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right">{item.label}</TooltipContent>
                          </Tooltip>
                      ))}
                  </nav>
              </TooltipProvider>

               <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleSidebar} 
                    className="absolute top-1/2 -right-4 -translate-y-1/2 h-8 w-8 rounded-full bg-background border hover:bg-secondary"
                >
                    {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </div>
        </aside>
        <div className={cn(
            "flex flex-col sm:gap-4 sm:py-4 transition-all duration-300",
            isSidebarCollapsed ? "sm:pl-14" : "sm:pl-56"
        )}>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="#"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base relative"
                  >
                      <Ticket className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">GoPass</span>
                  </Link>
                  {navItems.map((item) => (
                      <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                              "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                              isActive(item.href) && "text-foreground"
                          )}
                      >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                      </Link>
                  ))}
                   <div className="mt-auto grid gap-6">
                      <Separator />
                       {bottomNavItems.map((item) => (
                          <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                  "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                                  isActive(item.href) && "text-foreground"
                              )}
                          >
                              <item.icon className="h-5 w-5" />
                              {item.label}
                          </Link>
                      ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            <div className="relative ml-auto flex-1 md:grow-0">
              {/* Search can be added here if needed */}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full">
                      <Avatar>
                          <AvatarImage src={logoUrl || user?.photoURL || "https://placehold.co/40x40.png"} alt="@organizer" data-ai-hint="person avatar" />
                          <AvatarFallback>{currentOrganizer?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="sr-only">Toggle user menu</span>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="grid flex-1 items-start gap-4 p-2 sm:px-6 sm:py-0 md:gap-8">
             {children}
          </main>
        </div>
      </div>
    </CurrencyProvider>
  );
}
