
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventById } from '@/services/eventService';
import { addTicket } from '@/services/ticketService';
import type { Event, OmitIdTicket, Benefit, EventBenefit, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { ImageCropper } from '@/components/image-cropper';
import { formatEventPrice, currencies } from '@/lib/currency';
import { getUserProfile } from '@/services/userService';
import { PLANS } from '@/lib/plans';

export default function BuyTicketPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId as string;
    const { toast } = useToast();

    const [event, setEvent] = React.useState<Event | null>(null);
    const [organizerProfile, setOrganizerProfile] = React.useState<UserProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isPurchasing, setIsPurchasing] = React.useState(false);

    // Form state
    const [fullName, setFullName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [photoUrl, setPhotoUrl] = React.useState('');
    const [selectedBenefits, setSelectedBenefits] = React.useState<string[]>([]);

    // Cropper State
    const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchEventData = async () => {
            if (!eventId) return;
            setLoading(true);
            try {
                const fetchedEvent = await getEventById(eventId);
                if (fetchedEvent) {
                    setEvent(fetchedEvent);
                     if (fetchedEvent.organizerId) {
                        const profile = await getUserProfile(fetchedEvent.organizerId);
                        setOrganizerProfile(profile);
                    }
                    const trainingBenefit = fetchedEvent.benefits?.find(b => b.id === 'benefit_training');
                    if (trainingBenefit) {
                        setSelectedBenefits([trainingBenefit.id]);
                    }
                } else {
                    toast({ variant: "destructive", title: "Event not found" });
                    router.push('/events');
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to load event" });
            } finally {
                setLoading(false);
            }
        };
        fetchEventData();
    }, [eventId, router, toast]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageToCrop(event.target?.result as string);
                setIsCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleBenefitChange = (benefitId: string) => {
        const benefit = event?.benefits?.find(b => b.id === benefitId);
        if (benefit?.id === 'benefit_training') return; // Prevent unselecting training

        setSelectedBenefits(prev => 
            prev.includes(benefitId) ? prev.filter(id => id !== benefitId) : [...prev, benefitId]
        );
    };
    
    const totalCost = React.useMemo(() => {
        if (!event) return 0;
        return (event.benefits || [])
            .filter(b => selectedBenefits.includes(b.id))
            .reduce((acc, b) => acc + (b.price || 0), 0);
    }, [event, selectedBenefits]);

    const handlePurchase = async () => {
        if (!event) return;

        if (!fullName.trim() || !email.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide your full name and email.' });
            return;
        }

        const simpleEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!simpleEmail.test(email.trim())) {
            toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
            return;
        }
        
        const trainingBenefit = event.benefits?.find(b => b.id === 'benefit_training');
        if (trainingBenefit && !selectedBenefits.includes(trainingBenefit.id)) {
            setSelectedBenefits(prev => Array.from(new Set([...prev, trainingBenefit.id])));
        }

        setIsPurchasing(true);

        try {
            const latestEvent = await getEventById(event.id);
            if (!latestEvent) throw new Error('Event not found while purchasing');

            const latestOrganizer = latestEvent.organizerId ? await getUserProfile(latestEvent.organizerId) : null;
            const latestPlan = latestOrganizer?.planId ? PLANS[latestOrganizer.planId] : PLANS['hobby'];
            const latestMax = latestPlan.limits.maxTicketsPerEvent;

            if ((latestEvent.ticketsIssued ?? 0) >= latestMax) {
                toast({ variant: 'destructive', title: 'Event Full', description: 'No more tickets available.' });
                setIsPurchasing(false);
                return;
            }

            const newPin = Math.floor(100000 + Math.random() * 900000).toString();
            
            const benefitsForTicket: Benefit[] = (event.benefits || [])
                .filter(b => selectedBenefits.includes(b.id))
                .map((b: EventBenefit) => ({
                    id: b.id,
                    name: b.name,
                    used: false,
                    startTime: b.startTime ?? '',
                    endTime: b.endTime ?? '',
                    days: Array.isArray(b.days) && b.days.length ? b.days : [1],
                }));
            
            const bgPct = event.ticketTemplate?.backgroundOpacity;
            const backgroundImageOpacity = typeof bgPct === 'number'
              ? Math.max(0, Math.min(1, bgPct / 100))
              : 0.1;
                
            const newTicket: OmitIdTicket = {
                eventId: event.id,
                holderName: fullName,
                holderEmail: email,
                holderPhone: phone || '',
                holderPhotoUrl: photoUrl || `https://placehold.co/128x128.png`,
                pin: newPin,
                ticketType: event.ticketTemplate?.ticketType || 'Standard Pass',
                benefits: benefitsForTicket,
                status: 'active',
                holderTitle: '',
                backgroundImageUrl: event.ticketTemplate?.backgroundImageUrl || '',
                backgroundImageOpacity,
                totalPaid: totalCost
            };
            
            const createdTicketId = await addTicket(newTicket);
            if (!createdTicketId || typeof createdTicketId !== 'string') {
                throw new Error('addTicket returned an invalid ID');
            }

            sessionStorage.setItem('lastPurchaseDetails', JSON.stringify({ ticketId: createdTicketId, pin: newPin, eventId: event.id }));
            router.push(`/events/${event.id}/success`);

        } catch (error) {
            console.error('[Purchase] addTicket error:', error);
            toast({ variant: 'destructive', title: 'Purchase Failed', description: 'Could not create your ticket. Please try again.' });
            setIsPurchasing(false);
        }
    };

    const currentPlan = organizerProfile?.planId ? PLANS[organizerProfile.planId] : PLANS['hobby'];
    const maxTickets = currentPlan.limits.maxTicketsPerEvent;
    const canPurchase = event ? ((event.ticketsIssued ?? 0) < maxTickets) : false;

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Loading event details...</div>
    }

    if (!event) {
        return <div className="flex min-h-screen items-center justify-center">Event not found.</div>
    }
    
    const trainingBenefit = event.benefits?.find(b => b.id === 'benefit_training');
    const optionalBenefits = event.benefits?.filter(b => b.id !== 'benefit_training') || [];

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2" /> Back to event
            </Button>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Secure Your Spot for {event.name}</CardTitle>
                            <CardDescription>Fill in the ticket holder's details below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={photoUrl} alt={fullName} />
                                    <AvatarFallback>{fullName ? fullName.split(' ').map(n => n[0]).join('') : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1.5 flex-grow">
                                    <Label htmlFor="photo">Ticket Holder's Photo</Label>
                                    <Input id="photo" type="file" onChange={handlePhotoChange} accept="image/*" />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="full-name">Full Name</Label>
                                    <Input id="full-name" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" placeholder="john.doe@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                                    <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Event Benefits</CardTitle>
                            <CardDescription>Select optional add-ons to enhance your experience.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {trainingBenefit && (
                                <div className="flex items-center space-x-3 p-3 rounded-md border bg-secondary/50">
                                    <Checkbox id={trainingBenefit.id} checked={true} disabled />
                                    <div className="grid gap-1.5 leading-none flex-1">
                                        <label htmlFor={trainingBenefit.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {trainingBenefit.name}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                           Primary event access.
                                        </p>
                                    </div>
                                    <span className="font-semibold">{formatEventPrice({ price: trainingBenefit.price, currency: event.currency })}</span>
                                </div>
                            )}
                            {optionalBenefits.map(benefit => (
                                <div key={benefit.id} className="flex items-center space-x-3 p-3 rounded-md border">
                                    <Checkbox id={benefit.id} onCheckedChange={() => handleBenefitChange(benefit.id)} checked={selectedBenefits.includes(benefit.id)} />
                                    <div className="grid gap-1.5 leading-none flex-1">
                                        <label htmlFor={benefit.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {benefit.name}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            Available on Day(s): {benefit.days.join(', ')}
                                            {benefit.startTime && benefit.endTime ? ` from ${benefit.startTime} to ${benefit.endTime}` : ''}.
                                        </p>
                                    </div>
                                    <span className="font-semibold">{formatEventPrice({ price: benefit.price, currency: event.currency })}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative h-40 w-full rounded-md overflow-hidden">
                               <Image src={event.bannerUrl || 'https://placehold.co/600x400.png'} alt={event.name} fill style={{objectFit: 'cover'}} />
                            </div>
                            <h3 className="font-semibold">{event.name}</h3>
                            <p className="text-sm text-muted-foreground">{format(new Date(event.startDate), 'PPP')}</p>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                {event.benefits?.filter(b => selectedBenefits.includes(b.id)).map(b => (
                                     <div key={b.id} className="flex justify-between">
                                        <span>{b.name}:</span>
                                        <span>{formatEventPrice({ price: b.price, currency: event.currency })}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                             <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>{formatEventPrice({ price: totalCost, currency: event.currency })}</span>
                            </div>
                        </CardContent>
                        <CardContent>
                             <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePurchase} disabled={isPurchasing || !canPurchase}>
                                {isPurchasing ? <Loader2 className="mr-2 animate-spin" /> : null}
                                {isPurchasing ? 'Processing...' : !canPurchase ? 'Event Full' : 'Confirm Purchase'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {imageToCrop && (
                <ImageCropper
                    isOpen={isCropperOpen}
                    onClose={() => {
                        setIsCropperOpen(false);
                        setImageToCrop(null);
                    }}
                    imageSrc={imageToCrop}
                    onCropComplete={(croppedImageUrl) => {
                        setPhotoUrl(croppedImageUrl);
                        setIsCropperOpen(false);
                        setImageToCrop(null);
                    }}
                />
            )}
        </div>
    );
}
