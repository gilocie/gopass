
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MoreHorizontal, UserPlus, QrCode, Ticket, Unlink, Link as LinkIcon, DollarSign, History } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Event } from '@/lib/types';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { updateEvent } from '@/services/eventService';
import { formatEventPrice } from '@/lib/currency';

export const EventCard = ({ event, onDelete, maxTickets }: { event: Event, onDelete: (eventId: string) => void, maxTickets: number }) => {
    const router = useRouter();
    const { toast } = useToast();
    const defaultBanner = 'https://placehold.co/600x400.png';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventStartDate = new Date(event.startDate);
    eventStartDate.setHours(0,0,0,0);
    const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
    eventEndDate.setHours(23, 59, 59, 999);

    const isPast = event.status !== 'draft' && eventEndDate < today;
    const isOngoing = event.status !== 'draft' && eventStartDate <= today && today <= eventEndDate;
    const isDeleted = event.status === 'deleted';

    const handleTogglePublish = async () => {
        try {
            const updates: Partial<Event> = { isPublished: !event.isPublished };
            
            if (!event.isPublished && event.status === 'draft') {
                updates.status = 'upcoming';
            }

            await updateEvent(event.id, updates);
            toast({
                title: `Event ${event.isPublished ? 'Unpublished' : 'Published'}`,
                description: `"${event.name}" is now ${event.isPublished ? 'hidden from' : 'visible on'} your page.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the event status. Please try again.',
            });
        }
    };

    const handleScanClick = () => {
        if (event.ticketsIssued === 0) {
            toast({
                variant: 'destructive',
                title: 'No Tickets Issued',
                description: `There are no tickets for "${event.name}". Please add a participant first.`,
            });
        } else {
            router.push(`/verify?eventId=${event.id}`);
        }
    };
    
    const grossRevenue = (event.price || 0) * (event.ticketsIssued || 0);
    
    const getStatusBadge = () => {
        if (isDeleted) return <Badge variant="destructive">Archived</Badge>;
        if (isPast) return <Badge variant="secondary">Past</Badge>;
        if (isOngoing) return <Badge className="bg-green-600 text-white">Ongoing</Badge>;
        if (event.status === 'upcoming') return <Badge variant="default">Upcoming</Badge>;
        return <Badge variant="outline">Draft</Badge>;
    }


    return (
        <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
             <div className="relative h-40 w-full bg-secondary">
                <Image
                    src={event.bannerUrl || defaultBanner}
                    alt={event.name}
                    fill
                    style={{objectFit: "cover"}}
                    data-ai-hint="conference room"
                    crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>
            <CardHeader>
                <CardTitle className="truncate">{event.name}</CardTitle>
                <CardDescription>
                    {isDeleted && event.deletedAt 
                        ? `Archived on ${format(new Date(event.deletedAt.seconds * 1000), 'PPP')}` 
                        : format(new Date(event.startDate), 'PPP')
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                {isPast || isDeleted ? (
                    <>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <DollarSign className="h-4 w-4" />
                            <span>Gross Revenue: {formatEventPrice({ price: grossRevenue, currency: event.currency })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Ticket className="h-4 w-4" />
                            <span>{event.ticketsIssued} tickets issued</span>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Ticket className="h-4 w-4" />
                        <span>{event.ticketsIssued} / {isFinite(maxTickets) ? maxTickets : '∞'} tickets issued</span>
                    </div>
                )}
                
                <div className="mt-4">{getStatusBadge()}</div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 bg-secondary/50 p-4">
                <div className="flex w-full gap-2">
                    {isDeleted ? (
                        <Button variant="outline" className="flex-1" disabled><History className="mr-2 h-4 w-4"/> View History</Button>
                    ) : !isPast ? (
                        <>
                             <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                                <Link href={`/dashboard/designer?eventId=${event.id}`}><UserPlus className="mr-2 h-4 w-4"/> Add</Link>
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={handleScanClick}>
                                <QrCode className="mr-2 h-4 w-4"/> Scan
                            </Button>
                        </>
                    ) : (
                         <Button asChild variant="outline" className="flex-1">
                            <Link href={`/dashboard/events/${event.id}`}>View Report</Link>
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild><Link href={`/dashboard/events/${event.id}`}>View Details</Link></DropdownMenuItem>
                            {!isPast && !isDeleted && <DropdownMenuItem asChild><Link href={`/dashboard/events/${event.id}/edit`}>Edit</Link></DropdownMenuItem>}
                            <DropdownMenuSeparator />
                             {!isDeleted && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            Archive
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will archive the event "{event.name}". It will no longer be active but will be kept in your history.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(event.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Archive
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                             )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {!isPast && !isDeleted && (
                    <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleTogglePublish}>
                        {event.isPublished ? <Unlink className="mr-2 h-4 w-4" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                        {event.isPublished ? 'Unpublish from page' : 'Publish to your page'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};
