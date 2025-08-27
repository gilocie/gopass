
'use client';
import * as React from 'react';
import Draggable from 'react-draggable';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, ArrowLeft, Link as LinkIcon, PlusCircle, Trash2, Eye, FileDown, Save, ImageDown, Ticket, Palette, Info, Paintbrush, Pipette, Move, Copy, Check, Calendar, MapPin, Loader2, CaseUpper, Clock, X, Timer, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestoreEvents } from '@/hooks/use-firestore-events';
import { format, isSameMonth, isSameYear } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { OmitIdTicket, Ticket as TicketType, Benefit, EventBenefit, UserProfile } from '@/lib/types';
import { addTicket, getTicketById, updateTicket, getMostRecentTicketForEvent } from '@/services/ticketService';
import { updateEvent } from '@/services/eventService';
import Link from 'next/link';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { TicketPreview } from '@/components/ticket-preview';
import { useAuth } from '@/hooks/use-auth';
import { getDraft, saveDraft, deleteDraft } from '@/services/draftService';
import { useDebounce } from '@/hooks/use-debounce';
import { ImageCropper } from '@/components/image-cropper';
import { Checkbox } from '@/components/ui/checkbox';
import { getUserProfile } from '@/services/userService';
import Logo from '@/components/logo';
import { Switch } from '@/components/ui/switch';
import { stripUndefined } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


const participantTitles = [
    "Participant", "Trainer", "Pastor", "Guest of Honour", 
    "Player", "Comedian", "Artist", "Actor", 
    "Trainee", "Panelist", "Speaker", "VIP"
];

interface DesignerState {
    fullName: string;
    email: string;
    holderTitle: string;
    photoUrl: string;
    ticketType: string;
    benefits: Benefit[];
    backgroundImageUrl: string;
    backgroundOpacity: number;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    fontWeight: React.CSSProperties['fontWeight'];
    ticketWidth: number;
    ticketHeight: number;
    backgroundType: 'solid' | 'gradient';
    solidBackgroundColor: string;
    gradientStartColor: string;
    gradientEndColor: string;
    showWatermark: boolean;
}

export default function DesignerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const eventId = searchParams.get('eventId');
    const ticketId = searchParams.get('ticketId');
    const { events, loading: eventLoading } = useFirestoreEvents();
    const [isLoadingTicket, setIsLoadingTicket] = React.useState(!!ticketId);
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);

    // Form State
    const [fullName, setFullName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [holderTitle, setHolderTitle] = React.useState('Participant');
    const [photoUrl, setPhotoUrl] = React.useState('https://placehold.co/80x80.png');
    const [pin, setPin] = React.useState('');
    const [ticketType, setTicketType] = React.useState('VIP Pass');
    const [benefits, setBenefits] = React.useState<Benefit[]>([]);
    
    // Design State
    const [backgroundImageUrl, setBackgroundImageUrl] = React.useState('');
    const [backgroundOpacity, setBackgroundOpacity] = React.useState(10);
    const [primaryColor, setPrimaryColor] = React.useState('#ffffff');
    const [accentColor, setAccentColor] = React.useState('#8B5CF6');
    const [fontFamily, setFontFamily] = React.useState('Inter');
    const [fontWeight, setFontWeight] = React.useState<React.CSSProperties['fontWeight']>('bold');
    const [ticketWidth, setTicketWidth] = React.useState(350);
    const [ticketHeight, setTicketHeight] = React.useState(570);
    const [backgroundType, setBackgroundType] = React.useState<'solid' | 'gradient'>('solid');
    const [solidBackgroundColor, setSolidBackgroundColor] = React.useState('#110d19');
    const [gradientStartColor, setGradientStartColor] = React.useState('#110d19');
    const [gradientEndColor, setGradientEndColor] = React.useState('#2b1f42');
    const [showWatermark, setShowWatermark] = React.useState(true);

    // Cropper State
    const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = React.useState(false);

    const [isSaving, setIsSaving] = React.useState(false);
    const [creationProgress, setCreationProgress] = React.useState(0);
    const [isCreationComplete, setIsCreationComplete] = React.useState(false);
    const [showPreviewDialog, setShowPreviewDialog] = React.useState(false);
    const [newTicketId, setNewTicketId] = React.useState(ticketId || 'tkt_xyz123abc');
    const [isCopied, setIsCopied] = React.useState(false);
    const [templates, setTemplates] = useLocalStorage('ticket-templates', []);
    
    const draftId = ticketId || eventId;
    
    const ticketLinkRef = React.useRef<HTMLInputElement>(null);
    const draggableRef = React.useRef(null);

    const event = React.useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
    
     React.useEffect(() => {
        if (user) {
            const fetchUserProfile = async () => {
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);
                if (profile?.planId !== 'hobby') {
                    setShowWatermark(false);
                }
            };
            fetchUserProfile();
        }
    }, [user]);

    const getCurrentState = React.useCallback((): DesignerState => ({
        fullName, email, holderTitle, photoUrl, ticketType, benefits,
        backgroundImageUrl, backgroundOpacity, primaryColor, accentColor,
        fontFamily, fontWeight: String(fontWeight || 'normal'), ticketWidth, ticketHeight, backgroundType,
        solidBackgroundColor, gradientStartColor, gradientEndColor, showWatermark
    }), [
        fullName, email, holderTitle, photoUrl, ticketType, benefits,
        backgroundImageUrl, backgroundOpacity, primaryColor, accentColor,
        fontFamily, fontWeight, ticketWidth, ticketHeight, backgroundType,
        solidBackgroundColor, gradientStartColor, gradientEndColor, showWatermark
    ]);
    
    const debouncedStateToSave = useDebounce(getCurrentState(), 1000);

    React.useEffect(() => {
        if (user && draftId && !isSaving && !isLoadingTicket) {
            saveDraft(user.uid, draftId, debouncedStateToSave);
        }
    }, [user, draftId, isSaving, isLoadingTicket, debouncedStateToSave]);


    React.useEffect(() => {
        const hydrateFromState = (savedState: Partial<DesignerState & {backgroundImageOpacity?: number}> | null) => {
             if (savedState) {
                setFullName(savedState.fullName || '');
                setEmail(savedState.email || '');
                setHolderTitle(savedState.holderTitle || 'Participant');
                setPhotoUrl(savedState.photoUrl || 'https://placehold.co/80x80.png');
                setTicketType(savedState.ticketType || 'VIP Pass');
                setBenefits(savedState.benefits || []);
                setBackgroundImageUrl(savedState.backgroundImageUrl || '');
                const opacity = savedState.backgroundImageOpacity ? savedState.backgroundImageOpacity * 100 : (savedState.backgroundOpacity || 10);
                setBackgroundOpacity(opacity);
                setPrimaryColor(savedState.primaryColor || '#ffffff');
                setAccentColor(savedState.accentColor || '#8B5CF6');
                setFontFamily(savedState.fontFamily || 'Inter');
                setFontWeight(savedState.fontWeight || 'bold');
                setTicketWidth(savedState.ticketWidth || 350);
                setTicketHeight(savedState.ticketHeight || 570);
                setBackgroundType(savedState.backgroundType || 'solid');
                setSolidBackgroundColor(savedState.solidBackgroundColor || '#110d19');
                setGradientStartColor(savedState.gradientStartColor || '#110d19');
                setGradientEndColor(savedState.gradientEndColor || '#2b1f42');
                 if (typeof savedState.showWatermark === 'boolean') {
                    setShowWatermark(savedState.showWatermark);
                } else if (userProfile) {
                    setShowWatermark(userProfile.planId === 'hobby');
                }
            } else {
                if (userProfile) {
                    setShowWatermark(userProfile.planId === 'hobby');
                }
            }
        }

        const fetchInitialData = async () => {
            if (!user || !draftId || !eventId) return;

            setIsLoadingTicket(true);
            try {
                if (ticketId) { // Editing an existing ticket
                    const [draftData, ticketData] = await Promise.all([
                        getDraft(user.uid, draftId),
                        getTicketById(ticketId),
                    ]);

                    if (ticketData) {
                        setPin(ticketData.pin);
                        const draftIsNewer = draftData && draftData.lastSaved && ticketData.createdAt && draftData.lastSaved.getTime() > ticketData.createdAt.getTime();

                        if (draftIsNewer) {
                            hydrateFromState(draftData);
                        } else {
                            hydrateFromState({
                                fullName: ticketData.holderName,
                                email: ticketData.holderEmail,
                                holderTitle: ticketData.holderTitle || 'Participant',
                                photoUrl: ticketData.holderPhotoUrl || 'https://placehold.co/80x80.png',
                                ticketType: ticketData.ticketType,
                                benefits: ticketData.benefits,
                                backgroundImageUrl: ticketData.backgroundImageUrl || '',
                                backgroundImageOpacity: ticketData.backgroundImageOpacity,
                                ...event?.ticketTemplate
                            });
                        }
                    } else {
                        toast({ variant: 'destructive', title: 'Ticket not found' });
                    }
                } else { // Creating a new ticket
                    const [draftData, mostRecentTicket] = await Promise.all([
                        getDraft(user.uid, draftId),
                        getMostRecentTicketForEvent(eventId),
                    ]);

                    const draftIsNewer = draftData?.lastSaved && mostRecentTicket?.createdAt && draftData.lastSaved.getTime() > mostRecentTicket.createdAt.getTime();
                    
                    const resetBenefits = (benefits: Benefit[]): Benefit[] => {
                        return benefits.map(b => ({ ...b, used: false, lastUsedDate: undefined }));
                    };

                    if (draftData && (!mostRecentTicket || draftIsNewer)) {
                        hydrateFromState({
                            ...draftData,
                            benefits: resetBenefits(draftData.benefits || [])
                        });
                    } else if (mostRecentTicket) {
                        hydrateFromState({
                            ticketType: mostRecentTicket.ticketType,
                            benefits: resetBenefits(mostRecentTicket.benefits),
                            backgroundImageUrl: mostRecentTicket.backgroundImageUrl || '',
                            backgroundImageOpacity: mostRecentTicket.backgroundImageOpacity,
                            ...event?.ticketTemplate
                        });
                    } else if (event?.ticketTemplate) {
                         hydrateFromState({
                            ...event.ticketTemplate as DesignerState,
                            benefits: resetBenefits(event.ticketTemplate.benefits || [])
                        });
                    }

                    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                    setPin(newPin);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast({ variant: 'destructive', title: 'Failed to load data' });
            } finally {
                setIsLoadingTicket(false);
            }
        };

        if (user && !eventLoading && draftId) {
            fetchInitialData();
        }

    }, [user, draftId, eventId, ticketId, toast, eventLoading, event, userProfile]);
    
     React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isSaving && !ticketId && creationProgress < 90) {
            timer = setTimeout(() => setCreationProgress(prev => prev + 10), 100);
        } else if (isCreationComplete && creationProgress < 100) {
            setCreationProgress(100);
        }
        return () => clearTimeout(timer);
    }, [isSaving, creationProgress, ticketId, isCreationComplete]);


    React.useEffect(() => {
        if(event && !ticketId && benefits.length === 0) {
            const trainingBenefit = event.benefits?.find(b => b.id === 'benefit_training');
            if(trainingBenefit) {
                setBenefits([{
                    id: trainingBenefit.id,
                    name: trainingBenefit.name,
                    used: false,
                    startTime: trainingBenefit.startTime,
                    endTime: trainingBenefit.endTime,
                    days: trainingBenefit.days,
                }])
            }
        }
    }, [event, ticketId, benefits]);


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
    
    const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setBackgroundImageUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBenefitChange = (checked: boolean, benefit: EventBenefit) => {
        if (checked) {
            setBenefits(prev => [...prev, { id: benefit.id, name: benefit.name, used: false, startTime: benefit.startTime, endTime: benefit.endTime, days: benefit.days }]);
        } else {
            setBenefits(prev => prev.filter(b => b.id !== benefit.id));
        }
    };

    const handleSaveTicket = async () => {
        if (!eventId || !fullName || !email) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide the ticket holder\'s name and email.' });
            return;
        }
        if (!ticketId && event && event.ticketsIssued >= event.ticketsTotal) {
            toast({ variant: 'destructive', title: 'Event is Full', description: 'This event has reached its maximum ticket capacity.', });
            return;
        }

        setIsSaving(true);
        if (!ticketId) {
            setIsCreationComplete(false);
            setCreationProgress(0);
        }
        
        const totalPaid = event?.benefits
            ?.filter(b => benefits.some(selected => selected.id === b.id))
            .reduce((acc, b) => acc + b.price, 0) || 0;

        try {
            const rawState = getCurrentState();
            const eventTemplate = {
                fullName: rawState.fullName || '',
                email: rawState.email || '',
                holderTitle: rawState.holderTitle || 'Participant',
                photoUrl: rawState.photoUrl || '',
                ticketType: rawState.ticketType || 'General',
                benefits: rawState.benefits || [],
                backgroundImageUrl: rawState.backgroundImageUrl || '',
                backgroundOpacity: rawState.backgroundOpacity || 0,
                primaryColor: rawState.primaryColor || '#ffffff',
                accentColor: rawState.accentColor || '#8B5CF6',
                fontFamily: rawState.fontFamily || 'Inter',
                fontWeight: rawState.fontWeight || 'normal',
                ticketWidth: rawState.ticketWidth || 350,
                ticketHeight: rawState.ticketHeight || 570,
                backgroundType: rawState.backgroundType || 'solid',
                solidBackgroundColor: rawState.solidBackgroundColor || '#000000',
                gradientStartColor: rawState.gradientStartColor || '#000000',
                gradientEndColor: rawState.gradientEndColor || '#000000',
                showWatermark: rawState.showWatermark,
            };
            
            await updateEvent(eventId, { ticketTemplate: stripUndefined(eventTemplate) });

            if (ticketId) {
                const updatedTicketData: Partial<TicketType> = {
                    holderName: fullName,
                    holderEmail: email,
                    holderTitle,
                    holderPhotoUrl: photoUrl,
                    ticketType,
                    benefits,
                    backgroundImageUrl,
                    backgroundImageOpacity: backgroundOpacity / 100,
                    totalPaid,
                };
                await updateTicket(ticketId, stripUndefined(updatedTicketData));
                if (user && draftId) await deleteDraft(user.uid, draftId);
                toast({ title: 'Ticket Updated', description: 'The ticket has been successfully updated.' });
                router.back();
            
            } else {
                const newTicket: OmitIdTicket = {
                    eventId,
                    holderName: fullName,
                    holderEmail: email,
                    holderTitle,
                    holderPhotoUrl: photoUrl,
                    holderPhone: '',
                    pin,
                    ticketType,
                    benefits,
                    backgroundImageUrl: backgroundImageUrl,
                    backgroundImageOpacity: backgroundOpacity / 100,
                    status: 'active',
                    totalPaid,
                };
                const createdTicket = await addTicket(stripUndefined(newTicket));
                if (user && draftId) await deleteDraft(user.uid, draftId);
                setNewTicketId(createdTicket.id);
                setIsCreationComplete(true);
                setIsCopied(false);
                setFullName('');
                setEmail('');
                setHolderTitle('Participant');
                setPhotoUrl('https://placehold.co/80x80.png');
                const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                setPin(newPin);
            }
        } catch(error: any) {
            console.error("Save Ticket Error:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save ticket changes.' });
        } finally {
            if (ticketId) {
                setIsSaving(false);
            }
        }
    };
    
    const handleCopyLink = () => {
        if (ticketLinkRef.current) {
            navigator.clipboard.writeText(ticketLinkRef.current.value).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000); 
            });
        }
    };
    
    const handleShareViaEmail = () => {
        console.log(`Simulating email share to: ${email}`);
        console.log(`Ticket Link: ${ticketUrl}`);
        console.log(`PIN: ${pin}`);
        toast({
            title: 'Email Sent (Simulated)',
            description: `An email with the ticket link and PIN has been sent to ${email}.`,
        });
    };

    const handleSaveTemplate = () => {
        const newTemplate = {
            id: `template_${Date.now()}`,
            name: `${ticketType} Template`,
            description: `Custom template based on ${event?.name || 'event'}`,
            design: {
                backgroundImageUrl,
                backgroundOpacity,
                primaryColor,
                accentColor,
                fontFamily,
                fontWeight,
                ticketWidth,
                ticketHeight,
                backgroundType,
                solidBackgroundColor,
                gradientStartColor,
                gradientEndColor,
                showWatermark,
            },
        };
        setTemplates([...templates, newTemplate]);
        toast({
            title: "Template Saved",
            description: "Your current design has been saved as a new template.",
        });
    };
    
    const closeCreationDialog = () => {
        setIsSaving(false);
        setIsCreationComplete(false);
        setCreationProgress(0);
    };

    if (eventLoading || isLoadingTicket) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading designer...</div>;
    }
    
    if (!event) {
        return <div className="flex items-center justify-center h-full">Event not found. Please select an event first.</div>;
    }
    
    const formatDateRange = (start: Date, end: Date | undefined) => {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : undefined;
        
        if (endDate && isSameMonth(startDate, endDate) && isSameYear(startDate, endDate)) {
            return `${format(startDate, 'dd')} - ${format(endDate, 'dd')} ${format(startDate, 'MMM, yyyy')}`;
        }
        
        let datePart = format(startDate, 'MMM dd, yyyy');

        if (endDate) {
            datePart = `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
        }
        return datePart;
    };

    const eventDate = formatDateRange(new Date(event.startDate), event.endDate ? new Date(event.endDate) : undefined);
    const eventTime = `${event.startTime || ''}${event.endTime ? ` - ${event.endTime}` : ''}`;
    const benefitsUsed = benefits.filter(b => b.used).length;
    const qrCodeUrl = typeof window !== 'undefined' ? `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(window.location.origin + '/ticket/' + newTicketId + '?eventId=' + eventId)}` : 'https://placehold.co/128x128.png';
    const ticketUrl = typeof window !== 'undefined' ? `${window.location.origin}/ticket/${newTicketId}?eventId=${eventId}` : '';
    const backgroundStyle = backgroundType === 'solid' ? { backgroundColor: solidBackgroundColor } : { backgroundImage: `linear-gradient(${gradientStartColor}, ${gradientEndColor})` };

    const tempTicketForPreview: TicketType = {
        id: newTicketId,
        eventId: eventId,
        holderName: fullName || 'John Doe',
        holderEmail: email || 'john.doe@example.com',
        holderTitle: holderTitle || 'Participant',
        holderPhotoUrl: photoUrl,
        pin: pin,
        ticketType: ticketType || 'Ticket Pass',
        benefits: benefits,
        status: 'active',
        backgroundImageUrl: backgroundImageUrl,
        backgroundImageOpacity: backgroundOpacity / 100,
    };
    
    const displayWatermark = userProfile?.planId === 'hobby' && showWatermark;
    const isHobbyPlan = userProfile?.planId === 'hobby';

    return (
        <div className="flex flex-col gap-4 md:gap-6 h-full">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Ticket Designer</h1>
                    <p className="text-sm text-muted-foreground">
                        {ticketId ? 'Editing ticket for: ' : 'Creating ticket for: '} 
                        <span className="font-semibold text-primary">{event.name}</span>
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 flex-grow">
                <div className="lg:col-span-1 flex flex-col gap-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><span className="font-semibold">Location:</span> {event.location}, {event.country}</p>
                            <p><span className="font-semibold">Date:</span> {eventDate}</p>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col flex-grow">
                        <CardHeader>
                            <CardTitle>Customize Ticket</CardTitle>
                            <CardDescription className="text-xs">
                                Add participant details and design the ticket.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 flex-grow content-start">
                            <Tabs defaultValue="info" className="flex flex-col h-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="info"><Info className="h-4 w-4 mr-1"/> Ticket Info</TabsTrigger>
                                    <TabsTrigger value="design"><Palette className="h-4 w-4 mr-1"/> Design</TabsTrigger>
                                </TabsList>
                                <TabsContent value="info" className="pt-4 flex-grow overflow-y-auto">
                                    <div className="space-y-3 text-sm">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="full-name">Participant's Full Name</Label>
                                            <Input id="full-name" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="email">Recipient Email</Label>
                                            <Input id="email" type="email" placeholder="john.doe@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="holder-title">Participant Title</Label>
                                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                                <Select value={holderTitle} onValueChange={(value) => setHolderTitle(value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a title" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {participantTitles.map(title => (
                                                            <SelectItem key={title} value={title}>{title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input id="holder-title" placeholder="Or type a custom title" value={holderTitle} onChange={(e) => setHolderTitle(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="photo">Participant's Photo</Label>
                                            <Input id="photo" type="file" onChange={handlePhotoChange} accept="image/*" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="ticket-type">Ticket Type</Label>
                                            <Input id="ticket-type" placeholder="e.g., VIP, Standard" value={ticketType} onChange={(e) => setTicketType(e.target.value)} />
                                        </div>
                                        <Separator />
                                        <div className="grid gap-1.5">
                                            <Label>Benefits</Label>
                                            {(event.benefits && event.benefits.length > 0) ? (
                                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border p-3 rounded-md">
                                                    {event.benefits.map((benefit: EventBenefit) => (
                                                        <div key={benefit.id} className="flex items-center space-x-2">
                                                            <Checkbox 
                                                                id={`benefit-${benefit.id}`}
                                                                checked={benefits.some(b => b.id === benefit.id)}
                                                                onCheckedChange={(checked) => handleBenefitChange(!!checked, benefit)}
                                                                disabled={benefit.id === 'benefit_training'}
                                                            />
                                                            <label htmlFor={`benefit-${benefit.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                {benefit.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground p-3 bg-secondary rounded-md">No benefits defined for this event. You can add them by editing the event.</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="design" className="pt-4 flex-grow overflow-y-auto">
                                    <div className="space-y-4 text-sm">
                                        <div className="grid gap-1.5">
                                            <Label>Canvas Size</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input id="width" type="number" placeholder="Width" value={ticketWidth} onChange={e => setTicketWidth(Math.max(100, Number(e.target.value)))} />
                                                <Input id="height" type="number" placeholder="Height" value={ticketHeight} onChange={e => setTicketHeight(Math.max(100, Number(e.target.value)))} />
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="grid gap-2">
                                            <Label>Background Type</Label>
                                            <RadioGroup defaultValue="solid" value={backgroundType} onValueChange={(val) => setBackgroundType(val as 'solid' | 'gradient')} className="flex items-center gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="solid" id="solid" />
                                                    <Label htmlFor="solid" className="font-normal flex items-center gap-1.5"><Paintbrush className="h-3.5 w-3.5"/> Solid</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="gradient" id="gradient" />
                                                    <Label htmlFor="gradient" className="font-normal flex items-center gap-1.5"><Pipette className="h-3.5 w-3.5"/> Gradient</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        {backgroundType === 'solid' ? (
                                            <div className="grid gap-1.5 animate-in fade-in">
                                                <Label htmlFor="solid-bg-color">Background Color</Label>
                                                <Input id="solid-bg-color" type="color" value={solidBackgroundColor} onChange={(e) => setSolidBackgroundColor(e.target.value)} />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="gradient-start">Start</Label>
                                                    <Input id="gradient-start" type="color" value={gradientStartColor} onChange={(e) => setGradientStartColor(e.target.value)} />
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="gradient-end">End</Label>
                                                    <Input id="gradient-end" type="color" value={gradientEndColor} onChange={(e) => setGradientEndColor(e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="background-image">Background Image Overlay</Label>
                                            <Input id="background-image" type="file" onChange={handleBackgroundImageChange} accept="image/*" />
                                            {backgroundImageUrl && (
                                                <div className="grid gap-1.5 mt-2">
                                                    <Label>Image Opacity</Label>
                                                    <Slider defaultValue={[backgroundOpacity]} max={100} step={1} onValueChange={(value) => setBackgroundOpacity(value[0])}/>
                                                </div>
                                            )}
                                        </div>
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="primary-color">Primary Color</Label>
                                                <Input id="primary-color" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="accent-color">Accent Color</Label>
                                                <Input id="accent-color" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="grid gap-1.5">
                                            <Label>Heading Font</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Select value={fontFamily} onValueChange={setFontFamily}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Font Family" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Inter">Inter</SelectItem>
                                                        <SelectItem value="Roboto">Roboto</SelectItem>
                                                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select value={String(fontWeight)} onValueChange={(val) => setFontWeight(val as React.CSSProperties['fontWeight'])}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Font Weight" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="bold">Bold</SelectItem>
                                                        <SelectItem value="900">Black</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="watermark" className="flex items-center gap-2">
                                                    Show GoPass Watermark
                                                    {isHobbyPlan && <Crown className="h-4 w-4 text-yellow-500" />}
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {isHobbyPlan ? "Required on the Hobby plan." : "Toggle GoPass branding."}
                                                </p>
                                            </div>
                                            <Switch
                                                id="watermark"
                                                checked={showWatermark}
                                                onCheckedChange={setShowWatermark}
                                                disabled={isHobbyPlan}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <div className="mt-auto pt-4 space-y-3">
                                <Separator />
                                <div className="grid gap-1.5">
                                    <Label>Auto-generated PIN</Label>
                                    <Input readOnly value={pin} className="font-mono" />
                                </div>
                                <Button onClick={handleSaveTicket} disabled={isSaving && !isCreationComplete} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                                    {ticketId ? <><Save className="mr-2 h-4 w-4"/> {isSaving ? 'Saving...' : 'Save Changes'}</> : <><Mail className="mr-2 h-4 w-4"/> {isSaving && !isCreationComplete ? 'Creating...' : 'Create & Share Ticket'}</> }
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="hidden lg:block lg:col-span-2 lg:sticky lg:top-4 h-fit">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Live Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-start justify-center p-2 sm:p-4 bg-muted/20 relative cursor-grab active:cursor-grabbing">
                            <Draggable nodeRef={draggableRef} defaultPosition={{x: 0, y: 0}}>
                                <div ref={draggableRef} className="relative flex items-start justify-center mb-6">
                                    <div
                                        className="bg-card rounded-lg shadow-2xl flex flex-col p-6 border-4 border-primary/20 relative overflow-hidden transform-gpu"
                                        style={{
                                            fontFamily: fontFamily,
                                            width: `${ticketWidth}px`,
                                            height: `${ticketHeight}px`,
                                            ...backgroundStyle,
                                            maxWidth: "100%",
                                        }}
                                    >
                                        {backgroundImageUrl && (
                                            <div className="absolute inset-0 z-0">
                                                <img
                                                    src={backgroundImageUrl}
                                                    alt="background"
                                                    className="w-full h-full object-cover"
                                                    style={{ opacity: backgroundOpacity / 100 }}
                                                />
                                            </div>
                                        )}
                                        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full" style={{backgroundColor: `${accentColor}33`}} />
                                        <div className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full" style={{backgroundColor: `${accentColor}33`}} />
                                        
                                        {displayWatermark && (
                                            <div className="absolute bottom-2 right-2 z-20 opacity-50">
                                                <Logo className="text-white/50" />
                                            </div>
                                        )}

                                        <div className="z-10 flex flex-col h-full text-white">
                                            <div className="text-center">
                                                <p className="text-sm font-semibold uppercase tracking-widest" style={{color: accentColor}}>{event.name}</p>
                                                <h2 className="text-2xl mt-2" style={{color: primaryColor, fontWeight: fontWeight, fontFamily: fontFamily}}>{ticketType || 'Ticket Pass'}</h2>
                                            </div>

                                            <Separator className="my-6 bg-white/20" />

                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-4 text-left">
                                                    <Avatar className="h-16 w-16 border-2" style={{borderColor: accentColor + '80'}}>
                                                        <AvatarImage src={photoUrl} alt={fullName} data-ai-hint="person face" />
                                                        <AvatarFallback>{fullName ? fullName.split(' ').map(n => n[0]).join('') : "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-white/70 text-xs uppercase tracking-wider">{holderTitle || 'Participant'}</p>
                                                        <p className="text-xl font-bold" style={{color: primaryColor}}>{fullName || 'John Doe'}</p>
                                                        <p className="text-sm text-white/70">{email || 'john.doe@example.com'}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 space-y-1 text-sm text-left">
                                                    <div className="flex items-center gap-3">
                                                    <Calendar className="h-4 w-4 text-white/70" />
                                                    <p style={{color: primaryColor}}>{eventDate}</p>
                                                    </div>
                                                    {eventTime && (
                                                        <div className="flex items-center gap-3">
                                                            <Clock className="h-4 w-4 text-white/70" />
                                                            <p style={{color: primaryColor}}>{eventTime}</p>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                    <MapPin className="h-4 w-4 text-white/70" />
                                                    <p style={{color: primaryColor}}>{event.location}, {event.country}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Ticket className="h-4 w-4 text-white/70" />
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="font-mono text-base" style={{color: primaryColor}}>{benefitsUsed}/{benefits.length}</span>
                                                            <span className="text-xs text-white/70">Benefits Used</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-auto pt-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="p-2 bg-white rounded-lg">
                                                            <Image src={qrCodeUrl} alt="QR Code" width={100} height={100} className="h-24 w-24" />
                                                        </div>
                                                        <p className="text-xs text-center text-white/70 mt-2">Ticket ID</p>
                                                        <p className="font-mono text-center" style={{color: primaryColor}}>{newTicketId}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <TooltipProvider>
                                        <div className="hidden sm:flex flex-col gap-2 ml-2 p-2 bg-card rounded-lg border shadow-md">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" size="icon" onClick={() => setShowPreviewDialog(true)}><Eye/></Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right"><p>Preview</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" size="icon" onClick={handleSaveTemplate}><Save/></Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right"><p>Save Template</p></TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </TooltipProvider>
                                </div>
                            </Draggable>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:hidden mt-6">
                     <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Live Preview</CardTitle>
                        </CardHeader>
                         <CardContent className="flex-grow flex items-start justify-center p-2 sm:p-4 bg-muted/20 relative cursor-grab active:cursor-grabbing">
                             <Draggable nodeRef={draggableRef} defaultPosition={{x: 0, y: 0}}>
                                <div ref={draggableRef} className="relative flex items-start justify-center mb-6">
                                    <div
                                        className="bg-card rounded-lg shadow-2xl flex flex-col p-6 border-4 border-primary/20 relative overflow-hidden transform-gpu"
                                        style={{
                                            fontFamily: fontFamily,
                                            width: `${ticketWidth}px`,
                                            height: `${ticketHeight}px`,
                                            ...backgroundStyle,
                                            maxWidth: "100%",
                                        }}
                                    >
                                        {backgroundImageUrl && (
                                            <div className="absolute inset-0 z-0">
                                                <img
                                                    src={backgroundImageUrl}
                                                    alt="background"
                                                    className="w-full h-full object-cover"
                                                    style={{ opacity: backgroundOpacity / 100 }}
                                                />
                                            </div>
                                        )}
                                        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full" style={{backgroundColor: `${accentColor}33`}} />
                                        <div className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full" style={{backgroundColor: `${accentColor}33`}} />
                                        
                                        {displayWatermark && (
                                            <div className="absolute bottom-2 right-2 z-20 opacity-50">
                                                <Logo className="text-white/50" />
                                            </div>
                                        )}
                                        
                                        <div className="z-10 flex flex-col h-full text-white">
                                            <div className="text-center">
                                                <p className="text-sm font-semibold uppercase tracking-widest" style={{color: accentColor}}>{event.name}</p>
                                                <h2 className="text-2xl mt-2" style={{color: primaryColor, fontWeight: fontWeight, fontFamily: fontFamily}}>{ticketType || 'Ticket Pass'}</h2>
                                            </div>

                                            <Separator className="my-6 bg-white/20" />

                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-4 text-left">
                                                    <Avatar className="h-16 w-16 border-2" style={{borderColor: accentColor + '80'}}>
                                                        <AvatarImage src={photoUrl} alt={fullName} data-ai-hint="person face" />
                                                        <AvatarFallback>{fullName ? fullName.split(' ').map(n => n[0]).join('') : "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-white/70 text-xs uppercase tracking-wider">{holderTitle || 'Participant'}</p>
                                                        <p className="text-xl font-bold" style={{color: primaryColor}}>{fullName || 'John Doe'}</p>
                                                        <p className="text-sm text-white/70">{email || 'john.doe@example.com'}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 space-y-1 text-sm text-left">
                                                    <div className="flex items-center gap-3">
                                                    <Calendar className="h-4 w-4 text-white/70" />
                                                    <p style={{color: primaryColor}}>{eventDate}</p>
                                                    </div>
                                                    {eventTime && (
                                                        <div className="flex items-center gap-3">
                                                            <Clock className="h-4 w-4 text-white/70" />
                                                            <p style={{color: primaryColor}}>{eventTime}</p>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                    <MapPin className="h-4 w-4 text-white/70" />
                                                    <p style={{color: primaryColor}}>{event.location}, {event.country}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Ticket className="h-4 w-4 text-white/70" />
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="font-mono text-base" style={{color: primaryColor}}>{benefitsUsed}/{benefits.length}</span>
                                                            <span className="text-xs text-white/70">Benefits Used</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-auto pt-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="p-2 bg-white rounded-lg">
                                                            <Image src={qrCodeUrl} alt="QR Code" width={100} height={100} className="h-24 w-24" />
                                                        </div>
                                                        <p className="text-xs text-center text-white/70 mt-2">Ticket ID</p>
                                                        <p className="font-mono text-center" style={{color: primaryColor}}>{newTicketId}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <TooltipProvider>
                                        <div className="hidden sm:flex flex-col gap-2 ml-2 p-2 bg-card rounded-lg border shadow-md">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" size="icon" onClick={() => setShowPreviewDialog(true)}><Eye/></Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right"><p>Preview</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" size="icon" onClick={handleSaveTemplate}><Save/></Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right"><p>Save Template</p></TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </TooltipProvider>
                                </div>
                            </Draggable>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isSaving && !ticketId} onOpenChange={closeCreationDialog}>
                <DialogContent className="sm:max-w-md" showCloseButton={!isSaving || isCreationComplete}>
                     {isCreationComplete ? (
                        <>
                            <DialogHeader className="text-center">
                                <DialogTitle>Ticket Shared Successfully!</DialogTitle>
                                <DialogDescription>
                                    Your new ticket has been created. You can share the link below.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">Link</Label>
                                    <Input id="link" defaultValue={ticketUrl} readOnly ref={ticketLinkRef} />
                                </div>
                                <Button type="button" size="icon" className="h-9 w-9" onClick={handleCopyLink}>
                                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    <span className="sr-only">Copy</span>
                                </Button>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button onClick={handleShareViaEmail} className="w-full">
                                    <Mail className="mr-2 h-4 w-4" /> Share Via Email
                                </Button>
                                <Button variant="secondary" onClick={closeCreationDialog} className="w-full">
                                    Done
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Creating Ticket...</DialogTitle>
                                <DialogDescription>Please wait while we generate the ticket.</DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-2">
                                <Progress value={creationProgress} />
                                <p className="text-sm text-muted-foreground text-center">{creationProgress}% complete</p>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            
            <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
                <DialogContent showCloseButton={false} className="sm:max-w-fit p-0 bg-transparent border-0 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Ticket Preview</DialogTitle>
                        <DialogDescription className="sr-only">A preview of the generated ticket.</DialogDescription>
                    </DialogHeader>
                    <TicketPreview
                        ticket={tempTicketForPreview}
                        event={{
                            ...event,
                            ticketTemplate: getCurrentState(),
                        }}
                        userProfile={userProfile}
                    />
                </DialogContent>
            </Dialog>

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
