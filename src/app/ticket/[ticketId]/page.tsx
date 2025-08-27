
'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getTicketById } from '@/services/ticketService';
import { getEventById } from '@/services/eventService';
import type { Ticket, Event, Benefit } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { TicketPreview } from '@/components/ticket-preview';
import PinInput from '@/components/pin-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { addDays, format, differenceInMilliseconds, startOfToday, isAfter } from 'date-fns';

const Countdown = ({ targetDate }: { targetDate: Date }) => {
    const calculateTimeLeft = () => {
        const difference = differenceInMilliseconds(targetDate, new Date());
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });
    
    const { days, hours, minutes, seconds } = timeLeft;

    if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
        return <span className="text-primary font-semibold">Unlocked</span>;
    }

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>Unlocks in:</span>
            {days > 0 && <span>{days}d</span>}
            {hours > 0 && <span>{hours}h</span>}
            <span>{minutes}m</span>
            <span>{seconds}s</span>
        </div>
    );
};

export default function ViewTicketPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const ticketId = params.ticketId as string;
    const eventIdFromQuery = searchParams.get('eventId');
    
    const [ticket, setTicket] = React.useState<Ticket | null>(null);
    const [event, setEvent] = React.useState<Event | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [pin, setPin] = React.useState('');
    const [pinError, setPinError] = React.useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchData = async () => {
            if (!ticketId) return;
            setLoading(true);
            try {
                const ticketData = await getTicketById(ticketId);
                setTicket(ticketData);

                if (ticketData) {
                    const eventData = await getEventById(ticketData.eventId);
                    setEvent(eventData);
                    if (!eventData || (eventIdFromQuery && ticketData.eventId !== eventIdFromQuery)) {
                        toast({ variant: 'destructive', title: 'Mismatch Error', description: 'This ticket does not belong to the specified event.' });
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load ticket details.' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ticketId, eventIdFromQuery, toast]);
    
    const handleAuthorize = () => {
        if (ticket && pin === ticket.pin) {
            setIsAuthorized(true);
            setPinError('');
        } else {
            setPinError('Invalid PIN. Please try again.');
        }
    };
    
    const groupBenefitsByDay = () => {
        if (!event || !ticket) return [];
        const grouped: { day: number; date: Date; benefits: Benefit[] }[] = [];
        const eventStartDate = new Date(event.startDate);

        (ticket.benefits || []).forEach(benefit => {
            (benefit.days || []).forEach(dayNum => {
                let group = grouped.find(g => g.day === dayNum);
                if (!group) {
                    group = { day: dayNum, date: addDays(eventStartDate, dayNum - 1), benefits: [] };
                    grouped.push(group);
                }
                group.benefits.push(benefit);
            });
        });

        return grouped.sort((a, b) => a.day - b.day);
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading Ticket...</div>;
    }

    if (!ticket || !event) {
        return <div className="flex min-h-screen items-center justify-center">Ticket or Event not found.</div>;
    }

    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                 <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle>Enter Your PIN</CardTitle>
                        <CardDescription>Enter the 6-digit PIN associated with this ticket to view it.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <PinInput length={6} onComplete={setPin} />
                        {pinError && <p className="text-sm text-center text-destructive">{pinError}</p>}
                        <Button onClick={handleAuthorize} className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90">Authorize</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const benefitsByDay = groupBenefitsByDay();
    const today = startOfToday();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
                <TicketPreview ticket={ticket} event={event} onExit={() => setIsAuthorized(false)} />
                
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Daily Benefits</h2>
                    <Accordion type="single" collapsible defaultValue={`day-${benefitsByDay.find(d => format(d.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))?.day || 1}`}>
                       {benefitsByDay.map(({ day, date, benefits }) => {
                           const isFutureDay = isAfter(date, today);
                           return (
                                <AccordionItem key={day} value={`day-${day}`}>
                                    <AccordionTrigger disabled={isFutureDay}>
                                        <div className="flex items-center justify-between w-full">
                                            <div className="text-left">
                                                <p className="font-semibold">Day {day} Benefits</p>
                                                <p className="text-sm text-muted-foreground">{format(date, 'EEEE, MMMM d, yyyy')}</p>
                                            </div>
                                            {isFutureDay && (
                                                <div className="flex items-center gap-2 pr-2">
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                    <Countdown targetDate={date} />
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="space-y-2">
                                            {benefits.map(benefit => (
                                                <li key={benefit.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                                                    <span className="font-medium">{benefit.name}</span>
                                                    <Badge variant={benefit.used ? 'secondary' : 'default'}>
                                                        {benefit.used ? 'Used' : 'Available'}
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                           );
                       })}
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
