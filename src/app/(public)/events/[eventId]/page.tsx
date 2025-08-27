
'use client';

import * as React from 'react';
import { getEventById } from '@/services/eventService';
import { getOrganizerById } from '@/services/organizerService';
import type { Event, Organizer, UserProfile } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Share2, Ticket, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { formatEventPrice } from '@/lib/currency';
import { getUserProfile } from '@/services/userService';
import { PLANS } from '@/lib/plans';
import { Progress } from '@/components/ui/progress';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const eventId = params.eventId as string;
    const [event, setEvent] = React.useState<Event | null>(null);
    const [organizer, setOrganizer] = React.useState<Organizer | null>(null);
    const [organizerProfile, setOrganizerProfile] = React.useState<UserProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) return;
            setLoading(true);
            try {
                const fetchedEvent = await getEventById(eventId);
                if (fetchedEvent) {
                    setEvent(fetchedEvent);
                    if (fetchedEvent.organizerId) {
                        const orgData = await getOrganizerById(fetchedEvent.organizerId);
                        setOrganizer(orgData);
                        if (orgData?.userId) {
                            const profile = await getUserProfile(orgData.userId);
                            setOrganizerProfile(profile);
                        }
                    }
                } else {
                    toast({ variant: "destructive", title: "Event not found." });
                    router.push('/events');
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to load event details." });
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId, router, toast]);

    if (loading) {
        return <div className="container mx-auto px-4 py-12 text-center">Loading event...</div>;
    }

    if (!event) {
        return <div className="container mx-auto px-4 py-12 text-center">Could not find the event you're looking for.</div>;
    }
    
    const defaultBanner = 'https://placehold.co/1200x400.png';
    const currentPlan = organizerProfile?.planId ? PLANS[organizerProfile.planId] : PLANS['hobby'];
    const maxTickets = currentPlan.limits.maxTicketsPerEvent;
    const ticketsRemaining = maxTickets - event.ticketsIssued;
    const ticketProgress = isFinite(maxTickets) ? (event.ticketsIssued / maxTickets) * 100 : 0;
    const canPurchase = isFinite(maxTickets) ? event.ticketsIssued < maxTickets : true;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: event.name,
                text: `Check out this event: ${event.name}`,
                url: window.location.href,
            })
            .then(() => toast({ title: "Event shared successfully!" }))
            .catch((error) => console.error('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: "Link Copied!", description: "Event link copied to clipboard." });
        }
    };


    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Card className="overflow-hidden">
                <div className="relative h-64 w-full">
                    <Image
                        src={event.bannerUrl || defaultBanner}
                        alt={event.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="bg-secondary"
                        data-ai-hint="event banner"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>
                <CardContent className="p-6">
                   <div className="grid md:grid-cols-3 gap-8">
                       <div className="md:col-span-2 space-y-4">
                           <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                               <div className="flex-1">
                                    <h1 className="text-3xl md:text-4xl font-bold">{event.name}</h1>
                                    <p className="text-2xl font-bold text-primary mt-1">{event.isPaid ? formatEventPrice(event) : 'Free'}</p>
                               </div>
                                <Button size="lg" asChild className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={!canPurchase}>
                                   <Link href={`/events/${event.id}/buy`}>
                                     <Ticket className="mr-2 h-4 w-4" />
                                     {canPurchase ? 'Get Ticket' : 'Sold Out'}
                                   </Link>
                               </Button>
                           </div>
                           {isFinite(maxTickets) && (
                                <div className="space-y-2">
                                    <Progress value={ticketProgress} className="h-2" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        <span className="font-bold text-primary">{ticketsRemaining}</span> tickets left
                                    </p>
                                </div>
                            )}
                           <div className="mt-4 text-muted-foreground space-y-2 event-description">
                               <div dangerouslySetInnerHTML={{ __html: event.description }} />
                           </div>
                       </div>
                       <div className="md:col-span-1 space-y-4">
                           <Separator className="md:hidden"/>
                           <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                                    <span>{format(new Date(event.startDate), 'EEEE, MMMM do, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                    <span>{event.startTime} {event.endTime ? `- ${event.endTime}` : ''}</span>
                                </div>
                                 <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground"/>
                                    <span>{event.location}, {event.country}</span>
                                </div>
                           </div>
                           <Separator />
                            <div className="space-y-3 text-sm">
                                {organizer ? (
                                    <Link href={`/organizer/${organizer.id}`} className="flex items-center gap-3 group">
                                         <Avatar className="h-9 w-9">
                                            <AvatarImage src={organizer.logoUrl || "https://placehold.co/40x40.png"} alt={organizer.name} data-ai-hint="organization logo" />
                                            <AvatarFallback>{organizer.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold group-hover:underline">{organizer.name}</p>
                                            <p className="text-xs text-muted-foreground">Organizer</p>
                                        </div>
                                    </Link>
                                ) : (
                                     <div className="flex items-center gap-3">
                                         <Avatar className="h-9 w-9">
                                            <AvatarImage src="https://placehold.co/40x40.png" alt="Organizer" data-ai-hint="person avatar" />
                                            <AvatarFallback>GO</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">GoPass Events</p>
                                            <p className="text-xs text-muted-foreground">Organizer</p>
                                        </div>
                                    </div>
                                )}
                                <Button variant="outline" className="w-full" onClick={handleShare}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share Event
                                </Button>
                           </div>
                       </div>
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}
