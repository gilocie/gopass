
'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getTicketById } from '@/services/ticketService';
import { getEventById } from '@/services/eventService';
import type { Ticket, Event, Benefit, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Unlock, Check, CheckCheck, LogOut, Clock, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { TicketPreview } from '@/components/ticket-preview';
import PinInput from '@/components/pin-input';
import { Badge } from '@/components/ui/badge';
import { addDays, format, differenceInMilliseconds, startOfToday, isAfter, isBefore, parse, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { getUserProfile } from '@/services/userService';

const Countdown = ({ targetDate }: { targetDate: Date }) => {
    const calculateTimeLeft = React.useCallback(() => {
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
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });
    
    const { days, hours, minutes, seconds } = timeLeft;
    const timeParts = [];
    if (days > 0) timeParts.push(`${days}d`);
    if (hours > 0) timeParts.push(`${hours}h`);
    if (minutes > 0) timeParts.push(`${minutes}m`);
    timeParts.push(`${seconds}s`);


    if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
        return <span className="text-primary font-semibold">Unlocked</span>;
    }

    return (
        <div className="font-mono text-center">
            <p className="text-sm">Unlocks in</p>
            <p className="text-lg font-semibold tracking-wider">{timeParts.join(' ')}</p>
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
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [pin, setPin] = React.useState('');
    const [pinError, setPinError] = React.useState('');
    const { toast } = useToast();
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000); // Update every second for countdown and status
        return () => clearInterval(timer);
    }, []);

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
                    if (eventData?.organizerId) {
                        const profile = await getUserProfile(eventData.organizerId);
                        setUserProfile(profile);
                    }
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
            const days = Array.isArray(benefit.days) && benefit.days.length > 0 ? benefit.days : [1];
            days.forEach(dayNum => {
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
        <div className="min-h-screen bg-[#110d19]">
            <div className="container mx-auto max-w-md p-4 sm:p-6 lg:p-8 flex flex-col items-center">
                <TicketPreview ticket={ticket} event={event} userProfile={userProfile} onExit={() => setIsAuthorized(false)} />
                
                <div className="mt-8 w-full">
                    <h2 className="text-2xl font-bold mb-4 text-white">Daily Benefits</h2>
                    <div className="space-y-4">
                       {benefitsByDay.map(({ day, date, benefits }) => {
                           const dayStart = new Date(date);
                           dayStart.setHours(0,0,0,0);
                           const isToday = isSameDay(dayStart, today);
                           const isFutureDay = isAfter(dayStart, today);
                           const isPastDay = isBefore(dayStart, today);
                           
                           const getStatusIcon = () => {
                               if (isFutureDay) return <Lock className="h-5 w-5 text-red-400" />;
                               if (isToday) return <Unlock className="h-5 w-5 text-green-400" />;
                               if (isPastDay) {
                                   const usedCount = benefits.filter(b => b.used && b.lastUsedDate === format(date, 'yyyy-MM-dd')).length;
                                   if (usedCount === benefits.length) {
                                       return <CheckCheck className="h-5 w-5 text-green-400" />; // All used
                                   }
                                   if (usedCount === 0) {
                                       return <CheckCheck className="h-5 w-5 text-blue-400" />; // None used
                                   }
                                   return <Check className="h-5 w-5 text-blue-400" />; // Some used
                               }
                               return null;
                           }

                           return (
                                <Card key={day} className="overflow-hidden relative bg-card/80 backdrop-blur-sm border-white/10">
                                    {isFutureDay && (
                                        <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-white">
                                            <Lock className="h-8 w-8 mb-2" />
                                            <Countdown targetDate={dayStart} />
                                        </div>
                                    )}
                                    <CardHeader className="flex-row items-center justify-between text-white">
                                        <div>
                                            <CardTitle>Day {day} Benefits</CardTitle>
                                            <CardDescription className="text-white/70">{format(date, 'EEEE, MMMM d, yyyy')}</CardDescription>
                                        </div>
                                        {getStatusIcon()}
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {benefits.map(benefit => {
                                                const hasBeenUsedOnThisDay = benefit.used && benefit.lastUsedDate === format(date, 'yyyy-MM-dd');
                                                const endTimeString = benefit.endTime || '';
                                                const endTime = endTimeString ? parse(endTimeString, 'HH:mm', now) : null;
                                                const hasTimeExpiredToday = endTime && isAfter(now, endTime) && isSameDay(date, now);
                                                const isExpired = !hasBeenUsedOnThisDay && (isPastDay || hasTimeExpiredToday);

                                                return (
                                                    <li key={benefit.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-md text-white">
                                                        <span className={cn("font-medium", (hasBeenUsedOnThisDay || isExpired) && "line-through text-muted-foreground")}>{benefit.name}</span>
                                                        <Badge variant={hasBeenUsedOnThisDay ? 'secondary' : isExpired ? 'destructive' : 'default'}>
                                                            {hasBeenUsedOnThisDay ? 'Used' : isExpired ? 'Expired' : 'Available'}
                                                        </Badge>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </CardContent>
                                </Card>
                           );
                       })}
                    </div>
                </div>
            </div>
        </div>
    );
}

