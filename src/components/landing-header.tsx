
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import type { Organizer } from '@/lib/types';
import { getOrganizersByUserId } from '@/services/organizerService';
import { useToast } from '@/hooks/use-toast';
import { Settings, Loader2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const publicNavLinks = [
    { href: '/events', label: 'Events' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
]

export function LandingHeader() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [organizers, setOrganizers] = React.useState<Organizer[]>([]);
  const [loadingOrganizers, setLoadingOrganizers] = React.useState(true);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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


  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast({
            title: "Logged Out",
            description: "You have been successfully signed out.",
        });
        router.push('/');
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Logout Failed",
            description: "An error occurred while logging out.",
        });
    }
  };
  
  const handleDashboardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push('/dashboard');
  };

  const currentOrganizer = organizers[0];
  const logoUrl = currentOrganizer?.logoUrl;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center gap-4">
            {publicNavLinks.map(link => (
                <Button key={link.href} variant="link" asChild className="text-muted-foreground hover:text-primary">
                    <Link href={link.href}>{link.label}</Link>
                </Button>
            ))}
        </nav>

        <div className="flex items-center gap-4">
          {authLoading ? (
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/dashboard" onClick={handleDashboardClick}>
                  {isNavigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Dashboard
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarImage src={logoUrl || user.photoURL || "https://placehold.co/40x40.png"} alt="@organizer" data-ai-hint="organization logo" />
                      <AvatarFallback>{currentOrganizer?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
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
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
           <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium pt-8">
                  <Logo />
                  {publicNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                   <Separator />
                   {!user && !authLoading && (
                     <div className="space-y-2">
                        <Button asChild className="w-full">
                            <Link href="/login">Log In</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/register">Sign Up</Link>
                        </Button>
                     </div>
                   )}
                </nav>
              </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
