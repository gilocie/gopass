

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useFirestoreEvents } from '@/hooks/use-firestore-events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getOrganizersByUserId } from '@/services/organizerService';
import type { Organizer } from '@/lib/types';

export default function SelectEventForScanPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { events, loading: eventsLoading } = useFirestoreEvents();
    const [userOrganizations, setUserOrganizations] = React.useState<Organizer[]>([]);
    const [loadingOrgs, setLoadingOrgs] = React.useState(true);
    const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/select-event-for-scan');
        } else if (user) {
            const fetchOrgs = async () => {
                setLoadingOrgs(true);
                const orgs = await getOrganizersByUserId(user.uid);
                setUserOrganizations(orgs);
                setLoadingOrgs(false);
            };
            fetchOrgs();
        }
    }, [user, authLoading, router]);

    const userEvents = React.useMemo(() => {
        if (!user || userOrganizations.length === 0) return [];
        
        const orgIds = userOrganizations.map(org => org.id);
        const today = new Date();

        return events.filter(event => {
            if (!orgIds.includes(event.organizerId || '')) return false;
            if (event.status === 'deleted' || event.status === 'draft') return false;

            const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
            eventEndDate.setHours(23, 59, 59, 999);

            return today <= eventEndDate; // Event is not past
        });
    }, [events, user, userOrganizations]);

    React.useEffect(() => {
        if (!eventsLoading && !loadingOrgs && userEvents.length === 1) {
            router.push(`/verify?eventId=${userEvents[0].id}`);
        }
    }, [eventsLoading, loadingOrgs, userEvents, router]);

    const handleContinue = () => {
        if (selectedEventId) {
            router.push(`/verify?eventId=${selectedEventId}`);
        }
    };

    if (authLoading || !user || loadingOrgs) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (eventsLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading your events...</p>
            </div>
        );
    }
    
    if (userEvents.length === 0) {
        return (
             <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>No Active Events Found</CardTitle>
                        <CardDescription>You need to have at least one upcoming or ongoing event to scan tickets.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                            <Link href="/dashboard/events/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Your First Event
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (userEvents.length > 1) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Select an Event</CardTitle>
                        <CardDescription>Choose which event you would like to scan tickets for.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                           {userEvents.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    className={`w-full text-left p-3 border rounded-lg flex items-center gap-4 transition-all ${selectedEventId === event.id ? 'border-primary ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                                >
                                    <div className="relative h-16 w-24 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                                        <Image src={event.bannerUrl || 'https://placehold.co/600x400.png'} alt={event.name} fill style={{ objectFit: 'cover' }} />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{event.name}</p>
                                        <p className="text-sm text-muted-foreground">{event.location}</p>
                                    </div>
                                </button>
                           ))}
                        </div>
                         <Button onClick={handleContinue} disabled={!selectedEventId} className="w-full">
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Redirecting to scanner...</p>
        </div>
    );
}
