
'use client';

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Ticket, Users, DollarSign, CalendarPlus, PlusCircle, Trash2, Share2, Printer, FileDown, Search, Rocket, Building, X, Wallet, BadgeCheck, Link as LinkIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFirestoreEvents } from '@/hooks/use-firestore-events';
import { EventCard } from '@/components/event-card';
import { deleteEvent, updateEvent } from '@/services/eventService';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeTickets, deleteTicket, confirmTicketPayment } from '@/services/ticketService';
import type { Ticket as TicketType, Event, Organizer, UserProfile } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as DialogFooterComponent } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getOrganizerById, getOrganizersByUserId } from '@/services/organizerService';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/services/userService';
import { PLANS, PlanId } from '@/lib/plans';
import Logo from '@/components/logo';
import { useCurrency } from '@/contexts/CurrencyContext';
import { BASE_CURRENCY_CODE } from '@/lib/currency';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ClientLoader } from '@/components/client-loader';

export default function DashboardPage() {
  const { user } = useAuth();
  const { events, loading: eventsLoading } = useFirestoreEvents();
  const { toast } = useToast();
  const { format, currency } = useCurrency();
  const { tickets: allRecentTickets, loading: loadingTickets } = useRealtimeTickets(100);

  const [selectedTicket, setSelectedTicket] = React.useState<TicketType | null>(null);
  const [selectedUpgrade, setSelectedUpgrade] = React.useState<{planId: PlanId, date: string} | null>(null);
  const [userOrganizations, setUserOrganizations] = React.useState<Organizer[]>([]);
  const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);
  const [isUpgradeInvoiceOpen, setIsUpgradeInvoiceOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isConfirming, setIsConfirming] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
        const fetchUserData = async () => {
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);
            const orgs = await getOrganizersByUserId(user.uid);
            setUserOrganizations(orgs);
        };
        fetchUserData();
    }
  }, [user]);

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return eventDate >= today && (event.status === 'upcoming' || event.status === 'draft');
  });

  const { tickets: allTickets } = useRealtimeTickets(9999); 
  
  const completedTickets = allTickets.filter(ticket => ticket.paymentStatus === 'completed');

  const totalRevenue = completedTickets.reduce((acc, ticket) => {
    return acc + (ticket.totalPaid || 0);
  }, 0);

  const totalTicketsSold = completedTickets.length;
  const currentPlan = userProfile?.planId ? PLANS[userProfile.planId] : PLANS['hobby'];
  const maxEvents = currentPlan.limits.maxEvents;
  const eventsCount = events.filter(e => e.status !== 'deleted').length;
  const canCreateEvent = eventsCount < maxEvents;
  const totalTicketsAvailable = isFinite(maxEvents) ? maxEvents * currentPlan.limits.maxTicketsPerEvent : Infinity;
  const totalPaidOut = userProfile?.totalPaidOut || 0;
  const currentBalance = totalRevenue - totalPaidOut;

  const stats = [
    { title: `Total Revenue (${currency.code})`, value: format(totalRevenue, currency.code !== BASE_CURRENCY_CODE), change: 'from all events', icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Tickets Sold', value: `${totalTicketsSold} / ${isFinite(totalTicketsAvailable) ? totalTicketsAvailable : '∞'}`, change: 'based on your plan', icon: <Ticket className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Events Created', value: `${eventsCount} / ${isFinite(maxEvents) ? maxEvents : '∞'}`, change: 'based on your plan', icon: <CalendarPlus className="h-4 w-4 text-muted-foreground" /> },
  ];

  const handleDeleteEvent = async (eventId: string) => {
        const eventToDelete = events.find(e => e.id === eventId);
        if (eventToDelete) {
            try {
                // "Soft delete" by updating the status
                await updateEvent(eventId, { status: 'deleted' });
                toast({
                    title: "Event Archived",
                    description: `"${eventToDelete.name}" has been moved to history.`,
                });
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to archive event. Please try again.",
                });
            }
        }
    };
  
  const handleViewInvoice = async (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setIsInvoiceOpen(true);
  };
  
  const handleViewUpgradeInvoice = (upgrade: {planId: PlanId, date: string}) => {
    setSelectedUpgrade(upgrade);
    setIsUpgradeInvoiceOpen(true);
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    try {
        await deleteTicket(selectedTicket.id);
        toast({ title: "Transaction Deleted", description: `The ticket for ${selectedTicket.holderName} has been deleted.` });
        setIsInvoiceOpen(false);
        setSelectedTicket(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the transaction." });
    }
  };

  const handleConfirmPayment = async (ticketId: string) => {
    setIsConfirming(ticketId);
    try {
        await confirmTicketPayment(ticketId);
        toast({ title: 'Payment Confirmed', description: 'The ticket has been activated.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Confirmation Failed', description: error.message });
    } finally {
        setIsConfirming(null);
        setIsInvoiceOpen(false);
    }
  };
  
  const handlePrintInvoice = () => {
      if (!selectedTicket || !selectedEvent || !selectedOrganizer) return;
      
      const PrintableInvoice = () => (
        <html>
            <head>
                <title>Print Invoice</title>
                <style>{`
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; font-size: 12px; }
                    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                    h2, h3 { margin-top: 0; }
                    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
                    .invoice-header-info { text-align: right; }
                    .organizer-logo { max-width: 120px; max-height: 60px; margin-bottom: 0.5rem; }
                    .organizer-name { font-size: 1.5em; font-weight: bold; }
                    .details-section { margin-bottom: 20px; }
                    .details-section p { margin: 5px 0; }
                    .summary-section { margin-top: 30px; }
                    .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .summary-item:last-child { border-bottom: none; }
                    .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.5em; border-top: 2px solid #333; padding-top: 10px; margin-top: 20px; }
                    .font-mono { font-family: 'Courier New', Courier, monospace; }
                `}</style>
            </head>
            <body>
                <div className="invoice-box">
                    <div className="invoice-header">
                        <div>
                            {selectedOrganizer?.logoUrl && <img src={selectedOrganizer.logoUrl} alt={selectedOrganizer.name} className="organizer-logo" />}
                            <div className="organizer-name">${selectedOrganizer?.name || 'GoPass'}</div>
                        </div>
                        <div className="invoice-header-info">
                            <h2>Invoice</h2>
                            <p><strong>Invoice #:</strong> <span className="font-mono">${selectedTicket.id}</span></p>
                            {selectedTicket.createdAt && <p><strong>Date:</strong> ${new Date(selectedTicket.createdAt).toLocaleDateString()}</p>}
                        </div>
                    </div>
                     <div className="details-section">
                        <h3>Billed To</h3>
                        <p><strong>Name:</strong> ${selectedTicket.holderName}</p>
                        <p><strong>Email:</strong> ${selectedTicket.holderEmail}</p>
                        ${selectedTicket.holderPhone ? `<p><strong>Phone:</strong> ${selectedTicket.holderPhone}</p>` : ''}
                    </div>

                    <div className="summary-section">
                        <h3>Order Summary for "${selectedEvent.name}"</h3>
                        ${selectedTicket.benefits.map(benefit => {
                            const eventBenefit = selectedEvent.benefits?.find(b => b.id === benefit.id);
                            return (
                                `<div class="summary-item">
                                    <span>${benefit.name}</span>
                                    <span>${format(eventBenefit?.price || 0, true)}</span>
                                </div>`
                            )
                        }).join('')}
                        <div class="total">
                            <span>Total Paid:</span>
                            <span>${format(selectedTicket.totalPaid || 0, true)}</span>
                        </div>
                    </div>
                </div>
            </body>
        </html>
      );
      
      const printContent = renderToStaticMarkup(<PrintableInvoice />);
      const newWindow = window.open('', '_blank', 'height=600,width=800');
      newWindow?.document.write(printContent);
      newWindow?.document.close();
      newWindow?.focus();
      setTimeout(() => {
          newWindow?.print();
          newWindow?.close();
      }, 250);
  };
  
  const handlePrintUpgradeInvoice = () => {
    if (!selectedUpgrade || !primaryOrganization) return;
    
    const upgradedPlan = PLANS[selectedUpgrade.planId];

    const PrintableInvoice = () => (
        <html>
            <head>
                <title>Print Invoice</title>
                <style>{`
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; font-size: 12px; }
                    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                    h2, h3 { margin-top: 0; }
                    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
                    .invoice-header-info { text-align: right; }
                    .organizer-logo { max-width: 120px; max-height: 60px; margin-bottom: 0.5rem; }
                    .organizer-name { font-size: 1.5em; font-weight: bold; }
                    .details-section { margin-bottom: 20px; }
                    .details-section p { margin: 5px 0; }
                    .summary-section { margin-top: 30px; }
                    .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .summary-item:last-child { border-bottom: none; }
                    .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.5em; border-top: 2px solid #333; padding-top: 10px; margin-top: 20px; }
                    .font-mono { font-family: 'Courier New', Courier, monospace; }
                `}</style>
            </head>
            <body>
                <div className="invoice-box">
                    <div className="invoice-header">
                        <div>
                            <div className="organizer-name">GoPass</div>
                        </div>
                        <div className="invoice-header-info">
                            <h2>Invoice</h2>
                            <p><strong>Invoice #:</strong> <span className="font-mono">UPG-${new Date(selectedUpgrade.date).getTime()}</span></p>
                            <p><strong>Date:</strong> ${new Date(selectedUpgrade.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                     <div className="details-section">
                        <h3>Billed To</h3>
                        <p><strong>Organization:</strong> ${primaryOrganization.name}</p>
                        <p><strong>Email:</strong> ${user?.email}</p>
                    </div>

                    <div className="summary-section">
                        <h3>Order Summary</h3>
                        <div class="summary-item">
                            <span>Upgrade to ${upgradedPlan.name} Plan</span>
                            <span>${format(parseInt(upgradedPlan.price))}</span>
                        </div>
                        <div class="total">
                            <span>Total Paid:</span>
                            <span>${format(parseInt(upgradedPlan.price))}</span>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
    
    const printContent = renderToStaticMarkup(<PrintableInvoice />);
    const newWindow = window.open('', '_blank', 'height=600,width=800');
    newWindow?.document.write(printContent);
    newWindow?.document.close();
    newWindow?.focus();
    setTimeout(() => {
        newWindow?.print();
        newWindow?.close();
    }, 250);
};


  const handleShareInvoice = () => {
    if (!selectedTicket) return;
    const ticketUrl = `${window.location.origin}/ticket/${selectedTicket.id}?eventId=${selectedTicket.eventId}`;
    navigator.clipboard.writeText(ticketUrl).then(() => {
        toast({ title: "Link Copied", description: "Ticket link copied to clipboard." });
    });
  };
  
  const selectedEvent = selectedTicket ? events.find(e => e.id === selectedTicket.eventId) : null;
  const selectedOrganizer = selectedTicket && selectedEvent?.organizerId ? userOrganizations.find(o => o.id === selectedEvent.organizerId) : null;
  const primaryOrganization = userOrganizations.length > 0 ? userOrganizations[0] : null;

  const displayedTickets = allRecentTickets.slice(0, 6);
  
  const sortedUpgradeHistory = userProfile?.upgradeHistory
    ? [...userProfile.upgradeHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const displayedUpgrades = sortedUpgradeHistory.slice(0, 3);

  const getStatusBadge = (ticket: TicketType) => {
    const ticketEvent = events.find(e => e.id === ticket.eventId);
    const isLocal = (ticketEvent?.currency || BASE_CURRENCY_CODE) !== BASE_CURRENCY_CODE;

    switch(ticket.paymentStatus) {
        case 'pending':
            return <Badge variant="outline">Pending</Badge>;
        case 'awaiting-confirmation':
            return <Badge variant="secondary" className="bg-yellow-500 text-black">Confirm</Badge>;
        case 'completed':
            return <div className="text-sm font-medium">{format(ticket.totalPaid || 0, isLocal)}</div>;
        case 'failed':
            return <Badge variant="destructive">Failed</Badge>;
        default:
            return <Badge variant="secondary">N/A</Badge>;
    }
  }
  
   const getInvoiceStatusBadge = (ticket: TicketType) => {
    switch(ticket.paymentStatus) {
        case 'pending':
            return <Badge variant="outline">Pending Payment</Badge>;
        case 'awaiting-confirmation':
            return <Badge variant="secondary" className="bg-yellow-500 text-black">Awaiting Confirmation</Badge>;
        case 'completed':
            return <Badge variant="default" className="bg-green-600">Completed</Badge>;
        case 'failed':
            return <Badge variant="destructive">Failed</Badge>;
        default:
            return <Badge variant="secondary">N/A</Badge>;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>You are on the <span className="font-semibold text-primary">{currentPlan.name} Plan</span>.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href="/pricing">
                        <Rocket className="mr-2 h-4 w-4" />
                        Upgrade
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="grid gap-2">
                        <CardTitle>Your Upcoming Events</CardTitle>
                        <CardDescription>
                            Manage your upcoming events and view ticket sales.
                        </CardDescription>
                    </div>
                    <div className="flex sm:ml-auto items-center gap-2">
                        {canCreateEvent ? (
                            <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                                <Link href="/dashboard/events/new">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Event
                                </Link>
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" className="w-full sm:w-auto" disabled>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Event
                            </Button>
                        )}
                        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
                            <Link href="/dashboard/events">
                                View All
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                {!canCreateEvent && (
                    <Alert variant="destructive" className="mb-4 bg-destructive text-destructive-foreground border-destructive-foreground/20 [&>svg]:text-destructive-foreground">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <AlertTitle className="font-bold">Event Limit Reached</AlertTitle>
                                <AlertDescription>
                                    You have reached the maximum number of events for the {currentPlan.name} plan. Please upgrade to create more.
                                </AlertDescription>
                            </div>
                            <Button asChild variant="outline" className="bg-transparent border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive">
                                <Link href="/pricing">
                                    <Rocket className="mr-2 h-4 w-4" /> Upgrade Plan
                                </Link>
                            </Button>
                        </div>
                    </Alert>
                )}
                {upcomingEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {upcomingEvents.map((event) => (
                            <EventCard key={event.id} event={event} onDelete={handleDeleteEvent} maxTickets={currentPlan.limits.maxTicketsPerEvent} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        You have no upcoming events.
                    </div>
                )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Upgrades</CardTitle>
                    <CardDescription>Your recent plan transactions.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     {loadingTickets ? (
                        <p>Loading transactions...</p>
                    ) : displayedUpgrades.length > 0 ? (
                        <div className="space-y-4">
                            {displayedUpgrades.map((upgrade, index) => {
                                const plan = PLANS[upgrade.planId];
                                return (
                                    <div key={index} className="flex items-center gap-4 hover:bg-secondary/50 p-2 rounded-md cursor-pointer" onClick={() => handleViewUpgradeInvoice(upgrade)}>
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Rocket className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="grid gap-1 flex-1">
                                            <p className="text-sm font-medium leading-none">Upgrade to {plan.name}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(upgrade.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-sm font-medium">{format(parseInt(plan.price))}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-4">No upgrade transactions found.</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/transactions">
                            View All Transactions
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Wallet</CardTitle>
                    <CardDescription>Your current balance and payout information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-muted-foreground">Current Balance</span>
                            <span className="text-2xl font-bold">{format(currentBalance, currency.code !== BASE_CURRENCY_CODE)}</span>
                        </div>
                        <div className="flex justify-between items-baseline text-sm">
                            <span className="text-muted-foreground">Total Paid Out</span>
                            <span>{format(totalPaidOut, currency.code !== BASE_CURRENCY_CODE)}</span>
                        </div>
                    </div>
                     <Button asChild className="w-full">
                        <Link href="/dashboard/wallet">
                            <Wallet className="mr-2 h-4 w-4" />
                            View Wallet & Transactions
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>A list of your most recent ticket sales.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     {loadingTickets ? (
                        <p>Loading transactions...</p>
                    ) : displayedTickets.length > 0 ? (
                        <div className="space-y-4">
                            {displayedTickets.map(ticket => (
                                <div key={ticket.id} className="flex items-center gap-4 hover:bg-secondary/50 p-2 rounded-md cursor-pointer" onClick={() => handleViewInvoice(ticket)}>
                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                        <AvatarImage src={ticket.holderPhotoUrl} alt={ticket.holderName} />
                                        <AvatarFallback>{ticket.holderName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1 flex-1">
                                        <p className="text-sm font-medium leading-none">{ticket.holderName}</p>
                                        <p className="text-xs text-muted-foreground">{ticket.holderEmail}</p>
                                    </div>
                                    {getStatusBadge(ticket)}
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-4">No sales transactions found.</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/wallet">
                            View All Sales
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
       <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
            <DialogContent showCloseButton={false} className="sm:max-w-fit p-0 bg-transparent border-0 shadow-none flex items-start gap-2 justify-center">
                <DialogHeader>
                    <DialogTitle className="sr-only">Purchase Details for {selectedTicket?.holderName}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Invoice for transaction {selectedTicket?.id}
                    </DialogDescription>
                </DialogHeader>
                 {selectedTicket && selectedEvent && (
                    <>
                        <div className="p-6 bg-card rounded-lg border shadow-lg max-w-md w-full" id="invoice-print-area">
                             <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={selectedTicket.holderPhotoUrl} alt={selectedTicket.holderName} />
                                        <AvatarFallback>{selectedTicket.holderName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-lg">Billed To</h3>
                                        <div className="text-sm text-muted-foreground leading-snug">
                                            {selectedTicket.holderName}<br />
                                            {selectedTicket.holderEmail}<br />
                                            {selectedTicket.holderPhone}
                                        </div>
                                    </div>
                                </div>
                                {getInvoiceStatusBadge(selectedTicket)}
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-base">Transaction Details</h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Transaction ID:</span>
                                    <span className="font-mono">{selectedTicket.id}</span>
                                </div>
                                {selectedTicket.createdAt && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Date:</span>
                                        <span>{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-base">Order Summary for "{selectedEvent.name}"</h3>
                                {selectedTicket.benefits.map(benefit => {
                                    const eventBenefit = selectedEvent.benefits?.find(b => b.id === benefit.id);
                                    return (
                                        <div key={benefit.id} className="flex justify-between text-sm">
                                            <span>{benefit.name}</span>
                                            <span>${format(eventBenefit?.price || 0, true)}</span>
                                        </div>
                                    )
                                })}
                                <Separator className="my-2"/>
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total Paid:</span>
                                    <span>${format(selectedTicket.totalPaid || 0, true)}</span>
                                </div>
                            </div>
                             {selectedTicket.paymentStatus === 'awaiting-confirmation' && (
                                <div className="mt-4 pt-4 border-t space-y-3">
                                    {selectedTicket.receiptUrl && (
                                        <Button variant="outline" className="w-full" asChild>
                                            <a href={selectedTicket.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                <LinkIcon className="mr-2 h-4 w-4" /> View Receipt
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        className="w-full"
                                        onClick={() => handleConfirmPayment(selectedTicket.id)}
                                        disabled={isConfirming === selectedTicket.id}
                                    >
                                        {isConfirming === selectedTicket.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                                        {isConfirming === selectedTicket.id ? 'Confirming...' : 'Confirm Payment'}
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        <TooltipProvider>
                            <div className="flex flex-col gap-2 p-2 bg-card rounded-lg border shadow-md">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={handleShareInvoice}><Share2 /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Share Link</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={handlePrintInvoice}><Printer /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Print Invoice</p></TooltipContent>
                                </Tooltip>
                                <AlertDialog>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon"><Trash2 /></Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                         <TooltipContent side="right"><p>Delete Transaction</p></TooltipContent>
                                    </Tooltip>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the ticket for {selectedTicket?.holderName} and remove this transaction.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteTicket} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => setIsInvoiceOpen(false)}><X/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Close</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </>
                 )}
            </DialogContent>
        </Dialog>
        <Dialog open={isUpgradeInvoiceOpen} onOpenChange={setIsUpgradeInvoiceOpen}>
            <DialogContent showCloseButton={false} className="sm:max-w-fit p-0 bg-transparent border-0 shadow-none flex items-start gap-2 justify-center">
                 <DialogHeader>
                    <DialogTitle className="sr-only">Upgrade Invoice</DialogTitle>
                    <DialogDescription className="sr-only">
                        Invoice for your plan upgrade.
                    </DialogDescription>
                </DialogHeader>
                {selectedUpgrade && primaryOrganization && (
                    <>
                        <div className="p-6 bg-card rounded-lg border shadow-lg max-w-md w-full space-y-4">
                             <div>
                                <h3 className="font-semibold text-lg">Billed To</h3>
                                <div className="text-sm text-muted-foreground leading-snug">
                                    {primaryOrganization.name}<br />
                                    {user?.email}<br />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-base">Transaction Details</h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Transaction ID:</span>
                                    <span className="font-mono">UPG-${new Date(selectedUpgrade.date).getTime()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span>{new Date(selectedUpgrade.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-base">Order Summary</h3>
                                <div className="flex justify-between text-sm">
                                    <span>Upgrade to {PLANS[selectedUpgrade.planId].name} Plan</span>
                                    <span>${format(parseInt(PLANS[selectedUpgrade.planId].price))}</span>
                                </div>
                                <Separator className="my-2"/>
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total Paid:</span>
                                    <span>${format(parseInt(PLANS[selectedUpgrade.planId].price))}</span>
                                </div>
                            </div>
                        </div>
                        <TooltipProvider>
                            <div className="flex flex-col gap-2 p-2 bg-card rounded-lg border shadow-md">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={handlePrintUpgradeInvoice}><Printer /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Print Invoice</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => setIsUpgradeInvoiceOpen(false)}><X/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Close</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}
