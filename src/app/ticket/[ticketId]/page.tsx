
'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getTicketById, updateTicket, markTicketAsPaid } from '@/services/ticketService';
import { getEventById } from '@/services/eventService';
import type { Ticket, Event, Benefit, UserProfile, Organizer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Unlock, Check, CheckCheck, LogOut, Clock, Timer, CheckCircle2, XCircle, RefreshCw, AlertTriangle, WalletCards, Banknote, Smartphone, Upload } from 'lucide-react';
import { TicketPreview } from '@/components/ticket-preview';
import PinInput from '@/components/pin-input';
import { Badge } from '@/components/ui/badge';
import { addDays, format, differenceInMilliseconds, startOfToday, isAfter, isBefore, parse, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { getUserProfile } from '@/services/userService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getOrganizerById } from '@/services/organizerService';
import { Input } from '@/components/ui/input';

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

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);
    
    const { days, hours, minutes, seconds } = timeLeft;

    if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
        return <span className="text-primary font-semibold">Unlocked</span>;
    }

    return (
        <div className="font-mono text-center">
            <p className="text-sm">Unlocks in</p>
            <p className="text-lg font-semibold tracking-wider">
                {days > 0 && <span>{days}d </span>}
                {hours > 0 && <span>{hours}h </span>}
                {minutes > 0 && <span>{minutes}m </span>}
                <span>{seconds}s</span>
            </p>
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
    const [organizer, setOrganizer] = React.useState<Organizer | null>(null);
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [pin, setPin] = React.useState('');
    const [pinError, setPinError] = React.useState('');
    const { toast } = useToast();
    const [isMarkingPaid, setIsMarkingPaid] = React.useState(false);
    const [receiptDataUrl, setReceiptDataUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!ticketId) return;
        setLoading(true);

        const ticketDocRef = doc(db, 'tickets', ticketId);
        const unsubscribe = onSnapshot(ticketDocRef, async (doc) => {
            if (doc.exists()) {
                const ticketData = { id: doc.id, ...doc.data() } as Ticket;
                setTicket(ticketData);

                if (!event || event.id !== ticketData.eventId) {
                    const eventData = await getEventById(ticketData.eventId);
                    setEvent(eventData);
                    if (eventData) {
                        if (eventData.organizerId) {
                            const [profile, orgData] = await Promise.all([
                                getUserProfile(eventData.organizerId),
                                getOrganizerById(eventData.organizerId)
                            ]);
                            setUserProfile(profile);
                            setOrganizer(orgData);
                        }
                    }
                }
            } else {
                setTicket(null);
                setEvent(null);
                toast({ variant: 'destructive', title: 'Error', description: 'Ticket not found.' });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error with real-time ticket listener:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load ticket details in real-time.' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [ticketId, eventIdFromQuery, toast, event]);
    
    const handleAuthorize = () => {
        if (ticket && pin === ticket.pin) {
            setIsAuthorized(true);
            setPinError('');
        } else {
            setPinError('Invalid PIN. Please try again.');
        }
    };

    const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptDataUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setReceiptDataUrl(null);
        }
    };

    const handleMarkAsPaid = async () => {
        if (!ticket || !receiptDataUrl) return;
        setIsMarkingPaid(true);
        try {
            await markTicketAsPaid(ticket.id, receiptDataUrl);
            toast({ title: 'Success', description: 'The organizer has been notified and will confirm your payment shortly.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsMarkingPaid(false);
        }
    }
    
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
    const isPaymentComplete = ticket.paymentStatus === 'completed';

    const renderPaymentStatus = () => {
        if (ticket.paymentMethod !== 'manual') return null;
        const wire = organizer?.paymentDetails?.wireTransfer;
        const momo = organizer?.paymentDetails?.mobileMoney;

        switch(ticket.paymentStatus) {
            case 'pending':
                return (
                    <Alert variant="destructive" className="mt-6 bg-yellow-600/10 border-yellow-500/50 text-yellow-200 [&>svg]:text-yellow-400">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Payment Pending</AlertTitle>
                        <AlertDescription className="space-y-3">
                            <p>Your ticket is not yet active. Please complete the payment using the instructions below, then confirm.</p>
                             <Card className="my-3 text-foreground bg-background/50">
                                <CardContent className="p-4 text-sm space-y-3">
                                   {wire?.accountNumber && (
                                       <div className="space-y-1">
                                            <h4 className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4" /> Wire Transfer</h4>
                                            <p><strong>Bank:</strong> {wire.bankName}</p>
                                            <p><strong>Account Name:</strong> {wire.accountName}</p>
                                            <p><strong>Account Number:</strong> {wire.accountNumber}</p>
                                        </div>
                                   )}
                                   {wire?.accountNumber && momo?.phoneNumber && <Separator />}
                                    {momo?.phoneNumber && (
                                       <div className="space-y-1">
                                            <h4 className="font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile Money</h4>
                                            <p><strong>Provider:</strong> {momo.provider}</p>
                                            <p><strong>Name:</strong> {momo.accountName}</p>
                                            <p><strong>Number:</strong> {momo.phoneNumber}</p>
                                        </div>
                                   )}
                                </CardContent>
                             </Card>
                             <div className="grid gap-1.5">
                                <label htmlFor="receipt" className="text-xs font-medium flex items-center gap-2"><Upload className="h-3 w-3" /> Upload Receipt</label>
                                <Input id="receipt" type="file" onChange={handleReceiptFileChange} accept="image/*,application/pdf" className="text-xs file:text-xs" />
                             </div>
                             <Button onClick={handleMarkAsPaid} disabled={isMarkingPaid || !receiptDataUrl} className="w-full mt-2">
                                {isMarkingPaid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WalletCards className="mr-2 h-4 w-4" />}
                                {isMarkingPaid ? 'Submitting...' : 'I Have Paid'}
                            </Button>
                        </AlertDescription>
                    </Alert>
                );
            case 'awaiting-confirmation':
                 return (
                    <Alert className="mt-6 bg-yellow-600/10 border-yellow-500/50 text-yellow-200 [&>svg]:text-yellow-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertTitle>Awaiting Confirmation</AlertTitle>
                        <AlertDescription>
                           We have notified the event organizer. Your ticket will be activated once they confirm receipt of your payment.
                        </AlertDescription>
                    </Alert>
                );
            case 'completed':
                 return (
                    <Alert className="mt-6 bg-green-950 border-green-700 text-green-400 [&>svg]:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Payment Confirmed</AlertTitle>
                        <AlertDescription>
                           Your ticket is fully active. Enjoy the event!
                        </AlertDescription>
                    </Alert>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#110d19]">
            <div className="container mx-auto max-w-md p-4 sm:p-6 lg:p-8 flex flex-col items-center">
                {isPaymentComplete ? (
                    <TicketPreview ticket={ticket} event={event} userProfile={userProfile} onExit={() => setIsAuthorized(false)} />
                ) : (
                    <Card className="w-full bg-card/80 backdrop-blur-sm border-white/10 text-white text-center p-6">
                        <CardHeader>
                            <CardTitle>Payment Required</CardTitle>
                            <CardDescription>Your ticket will be available once payment is confirmed by the organizer.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             <Button onClick={() => setIsAuthorized(false)}><LogOut className="mr-2 h-4 w-4" /> Exit</Button>
                         </CardContent>
                    </Card>
                )}
                
                {renderPaymentStatus()}

                {isPaymentComplete && (
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
                                const benefitsForDay = benefits.filter(b => (b.days || []).includes(day));
                                if (isFutureDay) return <Lock className="h-5 w-5 text-red-400" />;
                                if (isToday) return <Unlock className="h-5 w-5 text-green-400" />;
                                if (isPastDay) {
                                    const usedCount = benefitsForDay.filter(b => b.used && b.lastUsedDate === format(date, 'yyyy-MM-dd')).length;
                                    
                                    if (benefitsForDay.length === 0) return <CheckCheck className="h-5 w-5 text-blue-400" />;
                                    if (usedCount === benefitsForDay.length) {
                                        return <CheckCheck className="h-5 w-5 text-green-400" />;
                                    }
                                    if (usedCount > 0 && usedCount < benefitsForDay.length) {
                                        return <Check className="h-5 w-5 text-blue-400" />;
                                    }
                                    return <CheckCheck className="h-5 w-5 text-blue-400" />;
                                }
                                return null;
                            }

                            return (
                                <Card key={day} className="overflow-hidden relative bg-card/80 backdrop-blur-sm border-white/10">
                                    {isFutureDay && ticket.status === 'active' && (
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
                                            {benefits.filter(b => (b.days || []).includes(day)).map(benefit => {
                                                const hasBeenUsedOnThisDay = benefit.used && benefit.lastUsedDate === format(date, 'yyyy-MM-dd');
                                                const endTimeString = benefit.endTime || '';
                                                const endTime = endTimeString ? parse(endTimeString, 'HH:mm', new Date()) : null;
                                                const hasTimeExpiredToday = endTime && isAfter(new Date(), endTime) && isSameDay(date, new Date());
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
                )}
            </div>
        </div>
    );
}
