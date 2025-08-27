
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Mail, Phone, Link as LinkIcon, Calendar } from 'lucide-react';
import { getEvents } from '@/services/eventService';
import { getOrganizerById } from '@/services/organizerService';
import type { Organizer, Event } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PublicEventCard } from '@/components/public-event-card';


export default function OrganizerProfilePage() {
    const params = useParams();
    const organizerId = params.organizerId as string;
    
    const [organizer, setOrganizer] = React.useState<Organizer | null>(null);
    const [events, setEvents] = React.useState<Event[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!organizerId) return;
            setLoading(true);
            try {
                const orgData = await getOrganizerById(organizerId);
                setOrganizer(orgData);

                const allEvents = await getEvents();
                setEvents(allEvents);

            } catch (error) {
                console.error("Failed to fetch organizer profile or events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [organizerId]);
    
    // Filter for events that belong to this organizer and are marked as published.
    const organizerEvents = events.filter(event => 
        event.organizerId === organizerId && event.isPublished
    );


    if (loading) {
        return <div className="container mx-auto px-4 py-12 text-center">Loading organizer profile...</div>;
    }

    if (!organizer) {
        return <div className="container mx-auto px-4 py-12 text-center">Organizer profile not found.</div>;
    }

    return (
        <div className="bg-secondary/50">
            <div className="relative h-48 md:h-64 w-full">
                {organizer.bannerUrl ? (
                    <Image
                        src={organizer.bannerUrl}
                        alt={`${organizer.name} banner`}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="bg-secondary"
                        data-ai-hint="organization banner"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-r from-primary to-accent"></div>
                )}
                <div className="absolute inset-0 bg-black/40"></div>
            </div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="relative -mt-16 md:-mt-24">
                    <div className="flex items-end gap-4">
                        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background bg-secondary">
                            <AvatarImage src={organizer.logoUrl || undefined} alt={`${organizer.name} logo`} data-ai-hint="organization logo" />
                            <AvatarFallback className="text-4xl">
                                {organizer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="pb-2">
                             <h1 className="text-2xl md:text-4xl font-bold">{organizer.name}</h1>
                             <Button variant="outline" size="sm" className="mt-2">Follow</Button>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mt-8">
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardContent className="pt-6 space-y-4 text-sm text-muted-foreground">
                                <p>{organizer.description}</p>
                                <Separator />
                                <div className="space-y-3">
                                    {organizer.contactEmail && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4" />
                                            <a href={`mailto:${organizer.contactEmail}`} className="hover:underline">{organizer.contactEmail}</a>
                                        </div>
                                    )}
                                     {organizer.contactPhone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4" />
                                            <span>{organizer.contactPhone}</span>
                                        </div>
                                    )}
                                    {organizer.website && (
                                        <div className="flex items-center gap-3">
                                            <LinkIcon className="h-4 w-4" />
                                            <a href={organizer.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{organizer.website}</a>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5" />
                            <h2 className="text-2xl font-bold">Upcoming Events</h2>
                        </div>
                        {organizerEvents.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {organizerEvents.map(event => (
                                    <PublicEventCard key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">
                                    {organizer.name} has no upcoming events.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
