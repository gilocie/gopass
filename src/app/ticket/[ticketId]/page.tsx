
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PinInput from '@/components/pin-input';
import Logo from '@/components/logo';
import { Lock, Timer, Clock, Unlock, Check, CheckCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import type { Event, Ticket, Benefit, UserProfile } from '@/lib/types';
import { getEventById } from '@/services/eventService';
import { getTicketById } from '@/services/ticketService';
import { TicketPreview } from '@/components/ticket-preview';
import { Badge } from '@/components/ui/badge';
import { addDays, differenceInDays, endOfDay, format, isAfter, isBefore, parse, startOfToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { getUserProfile } from '@/services/userService';


const CountdownInProgress = ({ to, prefix }: { to: Date, prefix: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const diff = to.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Completed');
                clearInterval(interval);
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [to]);
    
    return (
         <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600">{prefix} {timeLeft}</span>
            <Timer className="h-4 w-4 text-blue-500" />
        </div>
    );
};

const CountdownToDate = ({ to }: { to: Date }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const diff = to.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Unlocked');
                clearInterval(interval);
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft(`Unlocks in ${days}d ${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [to]);
    
    return (
         <div className="text-center">
            <p className="text-sm font-semibold text-white">{timeLeft}</p>
        </div>
    );
};


const BenefitItem = ({ benefit, dayDate }: { benefit: Benefit, dayDate: Date }) => {
    const now = new Date();
    const today = startOfToday();
    const isCurrentDay = isSameDay(dayDate, today);
    const isPastDay = isBefore(dayDate, today);

    const dayStr = format(dayDate, 'yyyy-MM-dd');
    const isUsedOnThisDay = benefit.used && benefit.lastUsedDate === dayStr;
    
    const startTime = benefit.startTime ? parse(benefit.startTime, 'HH:mm', dayDate) : null;
    const endTime = benefit.endTime ? parse(benefit.endTime, 'HH:mm', dayDate) : null;
    
    let isExpired = false;
    if (isCurrentDay) {
        isExpired = !isUsedOnThisDay && endTime && isAfter(now, endTime);
    } else if (isPastDay) {
        isExpired = !isUsedOnThisDay;
    }
    
    let isInProgress = false;
    if (isCurrentDay && isUsedOnThisDay && startTime && endTime) {
        isInProgress = isAfter(now, startTime) && isBefore(now, endTime);
    }

    return (
        <div className="flex items-center justify-between py-3">
            <span className={cn("text-foreground", (isUsedOnThisDay || isExpired) && 'line-through text-muted-foreground')}>
                {benefit.name}
            </span>
            {isInProgress && endTime ? (
                <CountdownInProgress to={endTime} prefix="Active for:" />
            ) : isUsedOnThisDay ? (
                 <Badge variant="secondary">Used</Badge>
            ) : isExpired ? (
                <Badge variant="destructive" className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Expired
                </Badge>
            ) : (
                <Badge variant="outline">Available</Badge>
            )}
        </div>
    )
};


export default function TicketPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const params = useParams();
  const ticketId = params.ticketId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchTicketAndEvent = async () => {
          if (!ticketId) return;
          try {
              setLoading(true);
              const fetchedTicket = await getTicketById(ticketId);
              if (fetchedTicket) {
                  setTicket(fetchedTicket);
                  const fetchedEvent = await getEventById(fetchedTicket.eventId);
                  setEvent(fetchedEvent);
                  if (fetchedEvent?.organizerId) {
                      const profile = await getUserProfile(fetchedEvent.organizerId);
                      setOrganizerProfile(profile);
                  }
              } else {
                setError("Ticket not found.");
              }
          } catch (err) {
              setError("Failed to load ticket data.");
          } finally {
              setLoading(false);
          }
      };
      fetchTicketAndEvent();
  }, [ticketId]);


  const handleVerifyPin = () => {
    if (ticket && pin === ticket.pin) { 
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid PIN. Please try again.');
    }
  };
  
  const handleExit = () => {
    window.close();
  };
  
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading ticket...</div>
  }

  if (!ticket || !event) {
     return <div className="flex min-h-screen items-center justify-center">{error || "Ticket or Event not found."}</div>
  }


  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-secondary">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
                <Lock className="h-5 w-5" /> Secure Ticket Access
            </CardTitle>
            <CardDescription>Enter the 6-digit PIN to view your ticket.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <PinInput length={6} onComplete={setPin} />
            {error && <p className="text-sm text-center text-destructive">{error}</p>}
            <Button onClick={handleVerifyPin} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              View Ticket
            </Button>
            <p className="text-xs text-muted-foreground text-center">Your PIN was sent to your registration email.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const today = startOfToday();
  const eventStartDate = new Date(event.startDate);
  const eventEndDate = event.endDate ? new Date(event.endDate) : eventStartDate;
  const totalDays = differenceInDays(endOfDay(eventEndDate), startOfToday(eventStartDate)) + 1;
  
  const benefitsByDay = Array.from({ length: totalDays }, (_, i) => {
    const dayDate = addDays(eventStartDate, i);
    const dayNumber = i + 1;
    const dayBenefits = ticket.benefits.filter(b => Array.isArray(b.days) && b.days.includes(dayNumber));
    
    if (dayBenefits.length === 0) return null;

    return {
        day: dayNumber,
        date: dayDate,
        benefits: dayBenefits,
    };
  }).filter(Boolean);
    
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-4 bg-muted/40">
        <TicketPreview ticket={ticket} event={event} userProfile={organizerProfile} onExit={handleExit} />
        
        {benefitsByDay.map(dayData => {
            if (!dayData) return null;
            const isCurrentDay = isSameDay(dayData.date, today);
            const isPastDay = isBefore(dayData.date, today);
            const isFutureDay = isAfter(dayData.date, today);

            const benefitsUsedCount = dayData.benefits.filter(b => b.used && b.lastUsedDate === format(dayData.date, 'yyyy-MM-dd')).length;
            const allBenefitsUsed = benefitsUsedCount === dayData.benefits.length;
            const someBenefitsUsed = benefitsUsedCount > 0 && !allBenefitsUsed;
            
            return (
             <Card 
                key={dayData.day} 
                className={cn(
                    "w-full max-w-md transition-opacity relative overflow-hidden",
                    (isPastDay || isFutureDay) && "opacity-60"
                )}
             >
                {isPastDay && (
                    <div className="absolute top-2 right-2 z-10">
                        {allBenefitsUsed ? (
                            <CheckCheck className="h-6 w-6 text-green-500 bg-white/80 rounded-full p-1" />
                        ) : someBenefitsUsed ? (
                            <Check className="h-6 w-6 text-blue-500 bg-white/80 rounded-full p-1" />
                        ) : null}
                    </div>
                 )}
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Day {dayData.day} Benefits</CardTitle>
                        <CardDescription>{format(dayData.date, 'EEEE, MMMM dd, yyyy')}</CardDescription>
                    </div>
                    {isCurrentDay && <Unlock className="h-5 w-5 text-green-500" />}
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {dayData.benefits.map((benefit, index) => (
                            <BenefitItem key={index} benefit={benefit} dayDate={dayData.date} />
                        ))}
                    </div>
                </CardContent>
                {isFutureDay && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                        <Lock className="h-10 w-10 text-red-500" />
                        <CountdownToDate to={dayData.date} />
                    </div>
                )}
            </Card>
        )})}
    </div>
  );
}
