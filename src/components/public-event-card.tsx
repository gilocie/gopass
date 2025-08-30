

'use client';

import type { Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, MapPin, Ticket, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { formatEventPrice } from '@/lib/currency';
import { PLANS } from '@/lib/plans';

export const PublicEventCard = ({ event }: { event: Event }) => {
    const defaultBanner = 'https://placehold.co/600x400.png';
    
    // Although we don't have the organizer's profile here, we can infer a default max.
    // A more robust solution would be to include organizer planId in the event data.
    // For now, we assume the base plan if ticketsTotal is not set.
    const maxTickets = event.ticketsTotal || PLANS.hobby.limits.maxTicketsPerEvent;
    const canPurchase = event.ticketsIssued < maxTickets;

    return (
        <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
            <div className="relative h-40 w-full">
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
                <CardDescription>{format(new Date(event.startDate), 'PPP')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}, {event.country}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    <span>{event.ticketsIssued} / {isFinite(maxTickets) ? maxTickets : '∞'} participants</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-secondary/50 p-4">
                <p className="font-semibold text-lg">{event.isPaid ? formatEventPrice(event) : 'Free'}</p>
                <div className="flex items-center gap-2">
                    <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!canPurchase}>
                        <Link href={`/events/${event.id}/buy`}>
                            <Ticket className="mr-2 h-4 w-4" />
                            {canPurchase ? 'Buy Ticket' : 'Sold Out'}
                        </Link>
                    </Button>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="outline" size="icon">
                                    <Link href={`/events/${event.id}`}>
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>View Details</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardFooter>
        </Card>
    );
};
