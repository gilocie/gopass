
'use client';

import * as React from 'react';
import jsQR from 'jsqr';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { QrCode, ScanLine, UserCheck, XCircle, RefreshCw, VideoOff, X, Video, CheckCircle2, AlertTriangle, Timer, Clock, CheckCheck, Lock, Unlock } from "lucide-react";
import PinInput from '@/components/pin-input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Ticket, Benefit, Event } from '@/lib/types';
import { getTicketById, updateTicket } from '@/services/ticketService';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getEventById } from '@/services/eventService';
import { differenceInDays, format, isAfter, isBefore, isSameDay, parse, startOfToday, differenceInMilliseconds } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error' | 'authenticating';

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
                <span className="inline-block animate-[pulse_1s_ease-in-out_infinite]">{seconds}s</span>
            </p>
        </div>
    );
};


const BenefitStatus = ({ benefit, event }: { benefit: Benefit, event: Event }) => {
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    if (!benefit.startTime || !benefit.endTime) return null;

    const todayStr = format(now, 'yyyy-MM-dd');
    if (benefit.used && benefit.lastUsedDate !== todayStr) return null; // Only show status for today's usage

    const startTime = parse(benefit.startTime, 'HH:mm', new Date());
    const endTime = parse(benefit.endTime, 'HH:mm', new Date());

    if (benefit.used && benefit.lastUsedDate === todayStr && isAfter(now, startTime) && isBefore(now, endTime)) {
        return (
            <Badge variant="secondary" className="mt-1 animate-pulse">
                <Timer className="h-3 w-3 mr-1" />
                In Progress
            </Badge>
        );
    }
    
    if (!benefit.used && isAfter(now, endTime)) {
        return (
             <Badge variant="destructive" className="mt-1">
                <Clock className="h-3 w-3 mr-1" />
                Expired
            </Badge>
        )
    }

    return null;
};


export default function VerifyPage() {
    const [status, setStatus] = React.useState<ScanStatus>('idle');
    const [pin, setPin] = React.useState('');
    const [pinError, setPinError] = React.useState('');
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [scannedTicket, setScannedTicket] = React.useState<Ticket | null>(null);
    const [event, setEvent] = React.useState<Event | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
    const [benefitToMark, setBenefitToMark] = React.useState<{ index: number; name: string } | null>(null);
    const [showMarkAllDialog, setShowMarkAllDialog] = React.useState(false);
    const [markAllPin, setMarkAllPin] = React.useState('');
    const [markAllPinError, setMarkAllPinError] = React.useState('');

    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const videoStreamRef = React.useRef<MediaStream | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const stopCamera = React.useCallback(() => {
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            videoStreamRef.current = null;
        }
    }, []);

    const startCamera = React.useCallback(async () => {
        if (videoStreamRef.current) {
           return true; // Already running
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            videoStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            if (error instanceof DOMException && error.name === "NotAllowedError") {
                 toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings.',
                });
            }
            return false;
        }
    }, [toast]);
    
    // Initial camera request
    React.useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);
    
    // Stop camera once authorized
    React.useEffect(() => {
        if(isAuthorized) {
            stopCamera();
        }
    }, [isAuthorized, stopCamera]);

    // QR Code Scanning Logic
    React.useEffect(() => {
        let animationFrameId: number;

        const scan = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                const context = canvas.getContext('2d');

                if (context) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        setStatus('authenticating');
                        handleQrCodeResult(code.data);
                        return; // Stop scanning
                    }
                }
            }
            if (status === 'scanning') {
                 animationFrameId = requestAnimationFrame(scan);
            }
        };

        if (status === 'scanning') {
            animationFrameId = requestAnimationFrame(scan);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [status]);
    
    const handleQrCodeResult = async (data: string) => {
        let ticketId: string | null = null;

        try {
            const url = new URL(data);
            const pathParts = url.pathname.split('/');
            ticketId = pathParts[pathParts.length - 1];
        } catch (e) {
            ticketId = data;
        }

        if (!ticketId) {
            setStatus('error');
            toast({ variant: 'destructive', title: 'Invalid QR Code', description: 'Could not extract a ticket ID from the QR code.' });
            return;
        }
            
        try {
            const ticketData = await getTicketById(ticketId);
            if (ticketData) {
                const eventData = await getEventById(ticketData.eventId);
                if (eventData) {
                    setScannedTicket(ticketData);
                    setEvent(eventData);
                    setStatus('success');
                } else {
                    setStatus('error');
                    toast({ variant: 'destructive', title: 'Event Not Found', description: 'Associated event for this ticket could not be found.' });
                }
            } else {
                setStatus('error');
                toast({ variant: 'destructive', title: 'Ticket Not Found' });
            }
        } catch (e) {
            setStatus('error');
            toast({ variant: 'destructive', title: 'Error Fetching Data', description: 'Could not retrieve ticket or event details.' });
            console.error(e);
        }
    }

    const handleStartScan = async () => {
        const cameraStarted = await startCamera();
        if (cameraStarted) {
            setStatus('scanning');
        } else {
             toast({ variant: 'destructive', title: 'No Camera Access', description: 'Cannot start scan without camera permission.' });
        }
    };

    const handleAuthorize = () => {
        if (scannedTicket && pin === scannedTicket.pin) {
            setIsAuthorized(true);
            setPinError('');
        } else {
            setPinError('Invalid PIN. Authorization failed.');
        }
    }

    const handleReset = () => {
        setStatus('idle');
        setIsAuthorized(false);
        setPin('');
        setPinError('');
        setScannedTicket(null);
        setEvent(null);
        startCamera();
    }
    
    const handleConfirmBenefitChange = async () => {
        if (!scannedTicket || benefitToMark === null) return;

        const { index } = benefitToMark;
        const updatedBenefits = [...scannedTicket.benefits];
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        updatedBenefits[index] = { ...updatedBenefits[index], used: true, lastUsedDate: todayStr };
        
        const updatedTicket = { ...scannedTicket, benefits: updatedBenefits };
        setScannedTicket(updatedTicket);

        try {
            await updateTicket(scannedTicket.id, { benefits: updatedBenefits });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update benefit status.' });
             // Revert optimistic update
             setScannedTicket(scannedTicket);
        } finally {
            setBenefitToMark(null);
        }
    }

    const handleMarkAllConfirm = async () => {
        if (!scannedTicket || !event || markAllPin !== scannedTicket.pin) {
            setMarkAllPinError('Invalid PIN. Please try again.');
            return;
        }
        setMarkAllPinError('');

        const today = startOfToday();
        const eventStart = new Date(event.startDate);
        if (isBefore(today, eventStart)) {
            toast({ variant: 'destructive', title: 'Action Denied', description: 'Cannot mark benefits before the event has started.' });
            setShowMarkAllDialog(false);
            setMarkAllPin('');
            return;
        }

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const currentDayOfEvent = getDayOfEvent(event);

        const updatedBenefits = scannedTicket.benefits.map(benefit => {
            if (benefit.days.includes(currentDayOfEvent) && !benefit.used) {
                return { ...benefit, used: true, lastUsedDate: todayStr };
            }
            return benefit;
        });

        const updatedTicket = { ...scannedTicket, benefits: updatedBenefits };
        setScannedTicket(updatedTicket);

        try {
            await updateTicket(scannedTicket.id, { benefits: updatedBenefits });
            toast({ title: 'Success', description: `All of today's benefits have been marked as used.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update benefits.' });
            setScannedTicket(scannedTicket); // Revert
        } finally {
            setShowMarkAllDialog(false);
            setMarkAllPin('');
        }
    };
    
    const handleTicketStatusChange = async () => {
        if (!scannedTicket) return;
        
        const newStatus = scannedTicket.status === 'active' ? 'cancelled' : 'active';
        const oldStatus = scannedTicket.status;
        setScannedTicket({ ...scannedTicket, status: newStatus });

        try {
            await updateTicket(scannedTicket.id, { status: newStatus });
             toast({ title: 'Status Updated', description: `Ticket is now ${newStatus}.` });
        } catch(error) {
             toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update ticket status.' });
             setScannedTicket({ ...scannedTicket, status: oldStatus });
        }
    }
    
    const getDayOfEvent = (event: Event): number => {
        const today = startOfToday();
        const eventStart = new Date(event.startDate);
        if (isBefore(today, eventStart)) return 1; // If event hasn't started, default to day 1
        return differenceInDays(today, eventStart) + 1;
    };

    const isEventActive = event ? !isBefore(startOfToday(), new Date(event.startDate)) : false;

    return (
        <div className="flex flex-col gap-6 items-center">
            <div className="w-full max-w-2xl">
                <Card>
                    <CardHeader className="text-center relative">
                        <CardTitle>Ticket Verification</CardTitle>
                        <CardDescription>Use the scanner to verify attendee tickets and manage benefits.</CardDescription>
                         <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => router.push('/dashboard')}>
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                        <div className="w-64 h-64 bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
                            {hasCameraPermission === false && (
                                 <div className="text-center text-muted-foreground p-4">
                                     <VideoOff className="h-16 w-16 mx-auto"/>
                                     <p className="mt-2">Camera permission denied.</p>
                                     <Button variant="link" onClick={startCamera}>Try again</Button>
                                 </div>
                            )}
                            {hasCameraPermission === null && (
                                <div className="text-center text-muted-foreground p-4">
                                    <Video className="h-16 w-16 mx-auto animate-pulse"/>
                                    <p className="mt-2">Requesting camera access...</p>
                                </div>
                            )}
                            <video ref={videoRef} className={cn("w-full h-full object-cover", status !== 'scanning' && 'hidden')} autoPlay playsInline muted />
                            <canvas ref={canvasRef} className="hidden" />

                            {status === 'idle' && hasCameraPermission && <QrCode className="h-32 w-32 text-muted-foreground/50 absolute" />}
                            {status === 'scanning' && <div className="w-full h-1 bg-accent absolute top-0 animate-[scan_1.5s_ease-in-out_infinite]" style={{boxShadow: '0 0 10px hsl(var(--accent))'}}/>}
                            {status === 'scanning' && <ScanLine className="h-32 w-32 text-muted-foreground/50 absolute" />}
                            {isAuthorized && scannedTicket && (
                                <div className="relative h-full w-full flex items-center justify-center">
                                    <Avatar className="h-full w-full rounded-none">
                                        <AvatarImage src={scannedTicket.holderPhotoUrl} alt={scannedTicket.holderName} className="object-cover" />
                                        <AvatarFallback className="text-6xl rounded-none">{scannedTicket.holderName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <CheckCircle2 className="h-12 w-12 text-green-500 bg-white rounded-full absolute top-2 right-2" fill="white" />
                                </div>
                            )}
                            {status === 'success' && !isAuthorized && <UserCheck className="h-32 w-32 text-green-500 absolute" />}
                            {status === 'error' && <XCircle className="h-32 w-32 text-destructive absolute" />}
                            {status === 'authenticating' && <p className="text-muted-foreground animate-pulse absolute">Verifying...</p>}
                        </div>
                        
                        {status === 'idle' && <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleStartScan} disabled={hasCameraPermission !== true}>Start Scan</Button>}
                        {status === 'scanning' && <p className="text-muted-foreground animate-pulse">Scanning for QR code...</p>}
                        {(status === 'success' || status === 'error') && !isAuthorized && <Button size="lg" variant="outline" onClick={handleReset}><RefreshCw className="mr-2 h-4 w-4"/> Scan Next</Button>}

                    </CardContent>
                </Card>

                {status === 'success' && !isAuthorized && (
                    <Card className="mt-6 w-full max-w-2xl animate-fade-in">
                         <CardHeader>
                            <CardTitle>Authorization Required</CardTitle>
                            <CardDescription>Please ask the ticket holder to enter their PIN to manage this ticket.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <PinInput length={6} onComplete={setPin} />
                            {pinError && <p className="text-sm text-center text-destructive">{pinError}</p>}
                            <Button onClick={handleAuthorize}>Authorize</Button>
                        </CardContent>
                    </Card>
                )}

                {status === 'success' && isAuthorized && scannedTicket && event && (
                    <Card className="mt-6 w-full max-w-2xl animate-fade-in">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{scannedTicket.holderName}</CardTitle>
                                    <CardDescription>Ticket Type: <span className="font-semibold text-primary">{scannedTicket.ticketType}</span></CardDescription>
                                </div>
                                <Badge variant={scannedTicket.status === 'active' ? 'default' : 'destructive'}>{scannedTicket.status.charAt(0).toUpperCase() + scannedTicket.status.slice(1)}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Benefits (Day {getDayOfEvent(event)})</h4>
                                <div className="space-y-2 relative">
                                     {!isEventActive && (
                                        <div className="absolute inset-0 bg-black/70 z-10 flex flex-col items-center justify-center text-white rounded-md">
                                            <Lock className="h-8 w-8 mb-2" />
                                            <Countdown targetDate={new Date(event.startDate)} />
                                        </div>
                                    )}
                                    {scannedTicket.benefits
                                        .filter(benefit => benefit.days.includes(getDayOfEvent(event)))
                                        .map((benefit) => {
                                        const benefitIndex = scannedTicket.benefits.findIndex(b => b.id === benefit.id);
                                        const now = new Date();
                                        const today = startOfToday();
                                        
                                        const todayStr = format(today, 'yyyy-MM-dd');
                                        const isUsedToday = benefit.used && benefit.lastUsedDate === todayStr;

                                        const startTime = benefit.startTime ? parse(benefit.startTime, 'HH:mm', now) : null;
                                        const endTime = benefit.endTime ? parse(benefit.endTime, 'HH:mm', now) : null;
                                        
                                        const isExpired = !isUsedToday && endTime && isAfter(now, endTime) && isEventActive;

                                        return (
                                            <div key={benefit.id} className="flex items-center space-x-2 p-3 bg-secondary rounded-md">
                                                <Checkbox 
                                                    id={`benefit-${benefit.id}`} 
                                                    checked={isUsedToday}
                                                    onCheckedChange={(checked) => {
                                                        if (checked && !isUsedToday) {
                                                            setBenefitToMark({ index: benefitIndex, name: benefit.name });
                                                        }
                                                    }}
                                                    disabled={isUsedToday || isExpired || !isEventActive}
                                                />
                                                <div className="flex-1">
                                                    <Label htmlFor={`benefit-${benefit.id}`} className={cn((isUsedToday || isExpired) && 'line-through text-muted-foreground', 'cursor-pointer')}>
                                                        {benefit.name}
                                                    </Label>
                                                    {isEventActive && <BenefitStatus benefit={benefit} event={event} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                             <Separator />
                             <div>
                                <h4 className="font-semibold mb-2">Ticket Actions</h4>
                                 <div className="flex flex-col sm:flex-row gap-2">
                                     <Button variant="destructive" onClick={handleTicketStatusChange}>
                                        {scannedTicket.status === 'active' ? 'Cancel Ticket' : 'Reactivate Ticket'}
                                    </Button>
                                    {isEventActive && (
                                        <Button variant="outline" onClick={() => setShowMarkAllDialog(true)}>
                                            <CheckCheck className="mr-2 h-4 w-4" /> Mark All for Today
                                        </Button>
                                    )}
                                    <Button onClick={handleReset} className="w-full sm:w-auto">Done</Button>
                                 </div>
                             </div>
                             <p className="text-xs text-muted-foreground pt-2">Managed by staff at {new Date().toLocaleTimeString()}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <AlertDialog open={!!benefitToMark} onOpenChange={(open) => !open && setBenefitToMark(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Benefit Usage</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark the benefit "{benefitToMark?.name}" as used? This action cannot be undone from this screen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBenefitToMark(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmBenefitChange}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={showMarkAllDialog} onOpenChange={setShowMarkAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm All Benefits</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will mark all available benefits for today as used. Please have the ticket holder confirm this action with their PIN.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <PinInput length={6} onComplete={setMarkAllPin} />
                        {markAllPinError && <p className="text-sm text-destructive">{markAllPinError}</p>}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setMarkAllPin(''); setMarkAllPinError(''); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMarkAllConfirm}>Authorize & Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(-10%); }
                    100% { transform: translateY(110%); }
                }
                .animate-\\[scan_1\\.5s_ease-in-out_infinite\\] {
                     animation: scan 1.5s ease-in-out infinite;
                }
                 @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
