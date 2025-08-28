
'use client';

import * as React from 'react';
import Link from 'next/link';
import { PlusCircle, Rocket } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFirestoreEvents } from '@/hooks/use-firestore-events';
import { useToast } from '@/hooks/use-toast';
import { updateEvent } from '@/services/eventService';
import { EventCard } from '@/components/event-card';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/services/userService';
import type { UserProfile, Event } from '@/lib/types';
import { PLANS } from '@/lib/plans';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

type HistoryFilter = 'all' | 'week' | 'month' | 'year';

export default function EventsPage() {
    const { events, loading } = useFirestoreEvents();
    const { toast } = useToast();
    const { user } = useAuth();
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    const [historyFilter, setHistoryFilter] = React.useState<HistoryFilter>('all');

    React.useEffect(() => {
        if (user) {
            const fetchUserProfile = async () => {
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);
            };
            fetchUserProfile();
        }
    }, [user]);

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
    
    const currentPlan = userProfile?.planId ? PLANS[userProfile.planId] : PLANS['hobby'];
    // The event count should include all non-deleted events to enforce the limit
    const eventsCount = events.filter(e => e.status !== 'deleted').length;
    const canCreateEvent = eventsCount < currentPlan.limits.maxEvents;


    const renderEvents = (filter: 'upcoming' | 'ongoing' | 'past' | 'draft' | 'all') => {
        if (loading) {
            return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><p>Loading events...</p></div>;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredEvents = events.filter(event => {
            // Exclude deleted events from all primary views
            if (event.status === 'deleted') return false;
            
            const eventStartDate = new Date(event.startDate);
            eventStartDate.setHours(0, 0, 0, 0);
            const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
            eventEndDate.setHours(23, 59, 59, 999); // Event is past at the end of its last day
            
            const isOngoing = eventStartDate <= today && today <= eventEndDate;

            switch (filter) {
                case 'all':
                    return true;
                case 'draft':
                    return event.status === 'draft';
                case 'ongoing':
                    return event.status !== 'draft' && isOngoing;
                case 'past':
                    return event.status !== 'draft' && eventEndDate < today;
                case 'upcoming':
                    return event.status !== 'draft' && eventStartDate > today;
                default:
                    return true;
            }
        });
        
        if (filteredEvents.length === 0) {
            return <p className="text-muted-foreground mt-4">No {filter !== 'all' ? filter : ''} events found. You can create one!</p>
        }
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} onDelete={handleDeleteEvent} maxTickets={currentPlan.limits.maxTicketsPerEvent} />
                ))}
            </div>
        );
    }
    
    const renderHistory = () => {
        if (loading) {
            return <p>Loading history...</p>;
        }

        const now = new Date();
        const historyEvents = events.filter(event => {
            if (event.status !== 'deleted' || !event.deletedAt) return false;
            
            const deletedDate = new Date(event.deletedAt.seconds * 1000);

            switch (historyFilter) {
                case 'week':
                    return isWithinInterval(deletedDate, { start: startOfWeek(now), end: endOfWeek(now) });
                case 'month':
                    return isWithinInterval(deletedDate, { start: startOfMonth(now), end: endOfMonth(now) });
                case 'year':
                    return isWithinInterval(deletedDate, { start: startOfYear(now), end: endOfYear(now) });
                case 'all':
                default:
                    return true;
            }
        });

        if (historyEvents.length === 0) {
            return <p className="text-muted-foreground mt-4">No archived events found for this period.</p>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyEvents.map(event => (
                    <EventCard key={event.id} event={event} onDelete={() => {}} maxTickets={currentPlan.limits.maxTicketsPerEvent} />
                ))}
            </div>
        );
    };


    return (
        <div className="flex flex-col gap-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">My Events</h1>
            <div className="ml-auto flex items-center gap-2">
                 {canCreateEvent ? (
                    <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                        <Link href="/dashboard/events/new" className="flex items-center gap-1">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Create Event
                            </span>
                        </Link>
                    </Button>
                ) : (
                    <Button size="sm" className="h-8 gap-1" disabled>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Create Event
                        </span>
                    </Button>
                )}
            </div>
        </div>
        {!canCreateEvent && (
            <Alert variant="destructive" className="bg-destructive text-destructive-foreground border-destructive-foreground/20 [&>svg]:text-destructive-foreground">
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
        <Tabs defaultValue="all">
            <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderEvents('all')}</TabsContent>
            <TabsContent value="upcoming">{renderEvents('upcoming')}</TabsContent>
            <TabsContent value="ongoing">{renderEvents('ongoing')}</TabsContent>
            <TabsContent value="past">{renderEvents('past')}</TabsContent>
            <TabsContent value="draft">{renderEvents('draft')}</TabsContent>
            <TabsContent value="history">
                 <div className="flex items-center gap-2 mt-4 mb-4">
                    <Button variant={historyFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setHistoryFilter('all')}>All Time</Button>
                    <Button variant={historyFilter === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setHistoryFilter('week')}>This Week</Button>
                    <Button variant={historyFilter === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setHistoryFilter('month')}>This Month</Button>
                    <Button variant={historyFilter === 'year' ? 'default' : 'outline'} size="sm" onClick={() => setHistoryFilter('year')}>This Year</Button>
                </div>
                {renderHistory()}
            </TabsContent>
        </Tabs>
        </div>
    );
}
