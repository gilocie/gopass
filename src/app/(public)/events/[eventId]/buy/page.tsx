

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventById } from '@/services/eventService';
import { addTicket, confirmTicketPayment } from '@/services/ticketService';
import type { Event, OmitIdTicket, Benefit, EventBenefit, UserProfile, Organizer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Banknote, Smartphone, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { ImageCropper } from '@/components/image-cropper';
import { formatCurrency, currencies, BASE_CURRENCY_CODE } from '@/lib/currency';
import { getUserProfile } from '@/services/userService';
import { PLANS } from '@/lib/plans';
import { getOrganizerById } from '@/services/organizerService';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { getCountryConfig, initiateDeposit, checkDepositStatus, PawaPayProvider } from '@/services/pawaPayService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';


export default function BuyTicketPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId as string;
    const { toast } = useToast();

    const [event, setEvent] = React.useState<Event | null>(null);
    const [organizer, setOrganizer] = React.useState<Organizer | null>(null);
    const [organizerProfile, setOrganizerProfile] = React.useState<UserProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isPurchasing, setIsPurchasing] = React.useState(false);

    // Form state
    const [fullName, setFullName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [photoUrl, setPhotoUrl] = React.useState('');
    const [selectedBenefits, setSelectedBenefits] = React.useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = React.useState<'online' | 'manual'>('online');
    const [phonePlaceholder, setPhonePlaceholder] = React.useState('991234567');

    // Online Payment State
    const [paymentStatus, setPaymentStatus] = React.useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
    const [depositId, setDepositId] = React.useState<string | null>(null);
    const [providers, setProviders] = React.useState<PawaPayProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = React.useState(true);
    const [selectedProvider, setSelectedProvider] = React.useState<PawaPayProvider | null>(null);
    const [countryPrefix, setCountryPrefix] = React.useState('');
    
    // Cropper State
    const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = React.useState(false);

     React.useEffect(() => {
        const fetchProviders = async () => {
            setLoadingProviders(true);
            try {
                const config = await getCountryConfig('MWI');
                if (config) {
                    setProviders(config.providers.filter(p => p.status === 'OPERATIONAL'));
                    setCountryPrefix(config.prefix);
                }
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not load payment providers.' });
            } finally {
                setLoadingProviders(false);
            }
        }
        fetchProviders();
    }, [toast]);

    React.useEffect(() => {
        const fetchEventData = async () => {
            if (!eventId) return;
            setLoading(true);
            try {
                const fetchedEvent = await getEventById(eventId);
                if (fetchedEvent) {
                    setEvent(fetchedEvent);
                     if (fetchedEvent.organizerId) {
                        const [profile, orgData] = await Promise.all([
                            getUserProfile(fetchedEvent.organizerId),
                            getOrganizerById(fetchedEvent.organizerId),
                        ]);
                        setOrganizerProfile(profile);
                        setOrganizer(orgData);
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
    
    // --- Polling Logic for Online Payments ---
    React.useEffect(() => {
        if (paymentStatus !== 'pending' || !depositId || !event) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const { status } = await checkDepositStatus(depositId);
                
                if (status === 'COMPLETED') {
                    setPaymentStatus('success');
                    await confirmTicketPayment(depositId);
                    toast({ title: 'Success!', description: `Your ticket for ${event.name} is confirmed.` });
                    clearInterval(interval);
                     
                    const lastPurchase = JSON.parse(sessionStorage.getItem('lastPurchaseDetails') || '{}');
                    if (lastPurchase.depositId === depositId) {
                        setTimeout(() => router.push(`/events/${event.id}/success`), 2000);
                    }
                } else if (status === 'FAILED' || status === 'REJECTED') {
                    setPaymentStatus('failed');
                    toast({ variant: 'destructive', title: 'Payment Failed', description: 'Your transaction could not be completed.' });
                    clearInterval(interval);
                    setIsPurchasing(false);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [paymentStatus, depositId, router, toast, event]);

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

    const createTicketInDb = async (paymentStatus: 'pending' | 'completed' | 'awaiting-confirmation', paymentMethod: 'manual' | 'online', depositId?: string) => {
        if (!event) throw new Error("Event data not available");

        const latestEvent = await getEventById(event.id);
        if (!latestEvent) throw new Error('Event not found while purchasing');
        
        const organizerId = latestEvent.organizerId;
        if (!organizerId) throw new Error("Event is missing an organizer.");

        const latestOrganizer = await getUserProfile(organizerId);
        const latestPlan = latestOrganizer?.planId ? PLANS[latestOrganizer.planId] : PLANS['hobby'];
        const latestMax = latestPlan.limits.maxTicketsPerEvent;

        if (isFinite(latestMax) && (latestEvent.ticketsIssued ?? 0) >= latestMax) {
            throw new Error('Event is full. No more tickets available.');
        }

        const newPin = Math.floor(100000 + Math.random() * 900000).toString();
        const benefitsForTicket: Benefit[] = (event.benefits || [])
            .filter(b => selectedBenefits.includes(b.id))
            .map((b: EventBenefit) => ({
                id: b.id, name: b.name, used: false,
                startTime: b.startTime ?? '', endTime: b.endTime ?? '',
                days: Array.isArray(b.days) && b.days.length ? b.days : [1],
            }));
        
        const bgPct = event.ticketTemplate?.backgroundOpacity;
        const backgroundImageOpacity = typeof bgPct === 'number' ? Math.max(0, Math.min(1, bgPct / 100)) : 0.1;
            
        const newTicket: OmitIdTicket = {
            eventId: event.id, holderName: fullName, holderEmail: email, holderPhone: phone || '',
            holderPhotoUrl: photoUrl || `https://placehold.co/128x128.png`, pin: newPin,
            ticketType: event.ticketTemplate?.ticketType || 'Standard Pass',
            benefits: benefitsForTicket, status: 'active', holderTitle: '',
            backgroundImageUrl: event.ticketTemplate?.backgroundImageUrl || '',
            backgroundImageOpacity, totalPaid: totalCost, paymentMethod, paymentStatus
        };
        
        const ticketIdToUse = depositId || undefined;
        const createdTicketId = await addTicket({ ...newTicket, id: ticketIdToUse });
        if (!createdTicketId) throw new Error("addTicket returned an invalid ID");
        
        return { ticketId: createdTicketId, pin: newPin };
    }

    const handlePurchase = async () => {
        if (!event || !fullName.trim() || !email.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide your full name and email.' });
            return;
        }
        setIsPurchasing(true);

        if (paymentMethod === 'online') {
            await handleOnlinePayment();
        } else {
            await handleManualPayment();
        }
    };

    const handleOnlinePayment = async () => {
        if (!event || !selectedProvider || !phone) {
            toast({ variant: 'destructive', title: 'Missing Details', description: 'Please select a provider and enter your phone number.' });
            setIsPurchasing(false);
            return;
        }

        setPaymentStatus('pending');

        try {
            const tempDepositId = uuidv4().toUpperCase();
            
            // First, create the ticket in a pending state
            const { ticketId, pin } = await createTicketInDb('pending', 'online', tempDepositId);

            // Now, initiate payment with PawaPay
            const result = await initiateDeposit({
                depositIdOverride: ticketId,
                amount: totalCost.toString(),
                currency: event.currency,
                country: 'MWI',
                correspondent: selectedProvider.provider,
                customerPhone: `${countryPrefix}${phone.replace(/^0+/, '')}`,
                statementDescription: `Ticket for ${event.name}`.substring(0, 25),
            });

            if (result.success && result.depositId) {
                setDepositId(result.depositId); // Start polling
                sessionStorage.setItem('lastPurchaseDetails', JSON.stringify({ ticketId, pin, eventId: event.id, depositId: result.depositId }));
            } else {
                setPaymentStatus('failed');
                toast({ variant: 'destructive', title: 'Payment Failed', description: result.message });
                setIsPurchasing(false);
            }
        } catch (error: any) {
            setPaymentStatus('failed');
            toast({ variant: 'destructive', title: 'Purchase Failed', description: error.message || 'Could not create your ticket.' });
            setIsPurchasing(false);
        }
    }

    const handleManualPayment = async () => {
        try {
            const { ticketId, pin } = await createTicketInDb('pending', 'manual');
            sessionStorage.setItem('lastPurchaseDetails', JSON.stringify({ ticketId, pin, eventId: event.id }));
            router.push(`/events/${event.id}/success`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Purchase Failed', description: error.message });
            setIsPurchasing(false);
        }
    }
    
    const handleProviderChange = (providerId: string) => {
        const provider = providers.find(p => p.provider === providerId) || null;
        setSelectedProvider(provider);
        if (provider?.provider.includes('AIRTEL')) {
            setPhonePlaceholder('991234567');
        } else if (provider?.provider.includes('TNM')) {
            setPhonePlaceholder('881234567');
        } else {
            setPhonePlaceholder('e.g. 991234567');
        }
    };

    const currentPlan = organizerProfile?.planId ? PLANS[organizerProfile.planId] : PLANS['hobby'];
    const maxTickets = event?.ticketsTotal ?? currentPlan.limits.maxTicketsPerEvent;
    const canPurchase = event ? (isFinite(maxTickets) ? ((event.ticketsIssued ?? 0) < maxTickets) : true) : false;
    
    const hasManualOptions = organizer?.paymentDetails?.wireTransfer?.accountNumber || organizer?.paymentDetails?.mobileMoney?.phoneNumber;

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Loading event details...</div>
    }

    if (!event) {
        return <div className="flex min-h-screen items-center justify-center">Event not found.</div>
    }
    
    const trainingBenefit = event.benefits?.find(b => b.id === 'benefit_training');
    const optionalBenefits = event.benefits?.filter(b => b.id !== 'benefit_training') || [];

    const isPurchaseDisabled = isPurchasing || !canPurchase || (paymentMethod === 'online' && (!selectedProvider || !phone));

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2" /> Back to event
            </Button>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {paymentStatus === 'pending' ? (
                         <Card>
                            <CardContent className="text-center p-8 flex flex-col items-center gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <h3 className="font-semibold text-lg">Awaiting Confirmation</h3>
                                <p className="text-muted-foreground text-sm">
                                    Please check your phone and enter your PIN to approve the payment of {formatCurrency(totalCost, currencies[event.currency])}.
                                </p>
                                <Button variant="outline" onClick={() => { setPaymentStatus('idle'); setIsPurchasing(false); }}>Cancel</Button>
                            </CardContent>
                        </Card>
                    ) : paymentStatus === 'success' ? (
                        <Card>
                            <CardContent className="text-center py-8 flex flex-col items-center gap-4">
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                                <h3 className="font-semibold text-lg">Payment Confirmed!</h3>
                                <p className="text-muted-foreground text-sm">
                                    Redirecting you to your ticket...
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                    <>
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
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
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
                                        <span className="font-semibold">{formatCurrency(trainingBenefit.price, currencies[event.currency])}</span>
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
                                        <span className="font-semibold">{formatCurrency(benefit.price, currencies[event.currency])}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Method</CardTitle>
                                <CardDescription>Select how you'd like to pay.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as 'online' | 'manual')} className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <RadioGroupItem value="online" id="online" className="peer sr-only" />
                                        <Label htmlFor="online" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                            <Smartphone className="mb-3 h-6 w-6" />
                                            Mobile Money
                                        </Label>
                                    </div>
                                    {hasManualOptions && (
                                        <div>
                                            <RadioGroupItem value="manual" id="manual" className="peer sr-only" disabled={!hasManualOptions} />
                                            <Label htmlFor="manual" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", hasManualOptions ? 'cursor-pointer' : 'cursor-not-allowed opacity-50')}>
                                                <Banknote className="mb-3 h-6 w-6" />
                                                Manual Payment
                                            </Label>
                                        </div>
                                    )}
                                </RadioGroup>

                                {paymentMethod === 'online' && (
                                    <div className="mt-6 space-y-4 animate-in fade-in">
                                        <Separator />
                                        <Label>Select Mobile Money Provider</Label>
                                         {loadingProviders ? (
                                            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
                                        ) : (
                                            <RadioGroup value={selectedProvider?.provider} onValueChange={handleProviderChange} className="grid grid-cols-2 gap-4">
                                                {providers.map(p => (
                                                    <div key={p.provider}>
                                                        <RadioGroupItem value={p.provider} id={p.provider} className="peer sr-only" />
                                                        <Label htmlFor={p.provider} className="flex items-center justify-center rounded-md border-2 border-muted bg-muted/20 hover:border-primary peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors cursor-pointer h-16 p-2 overflow-hidden">
                                                            <div className="relative w-full h-full"><Image src={p.logo} alt={p.displayName} fill style={{ objectFit: 'contain' }} /></div>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        )}
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone-number">Phone Number</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">+{countryPrefix}</div>
                                                <Input id="phone-number" placeholder={phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-14" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {paymentMethod === 'manual' && hasManualOptions && (
                                     <div className="mt-6 space-y-4 animate-in fade-in">
                                         <Separator />
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertTitle>Next Steps</AlertTitle>
                                            <AlertDescription>
                                                After purchase, your ticket will be reserved. Payment instructions will be available on your ticket page, which you can access with a secure PIN.
                                            </AlertDescription>
                                        </Alert>
                                     </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                    )}
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
                                        <span>{formatCurrency(b.price, currencies[event.currency])}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                             <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>{formatCurrency(totalCost, currencies[event.currency])}</span>
                            </div>
                        </CardContent>
                        <CardContent>
                             <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePurchase} disabled={isPurchaseDisabled}>
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

