
'use client';

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, PlusCircle, FileDown, Edit, Trash2, Send, Copy, Check, Eye, X, QrCode } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useFirestoreEvents } from '@/hooks/use-firestore-events';
import { deleteTicket, useEventTickets } from '@/services/ticketService';
import type { Ticket, Event, UserProfile } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { TicketPreview } from '@/components/ticket-preview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DownloadableTicket } from '@/components/downloadable-ticket';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/services/userService';
import { PLANS } from '@/lib/plans';
import { formatEventPrice } from '@/lib/currency';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const eventId = params.eventId as string;
    const { events, loading: eventsLoading } = useFirestoreEvents();
    const event = events.find(e => e.id === eventId);
    
    const { tickets, loading: ticketsLoading } = useEventTickets(eventId);
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    const { user } = useAuth();

    const [showShareDialog, setShowShareDialog] = React.useState(false);
    const [showViewDialog, setShowViewDialog] = React.useState(false);
    const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
    const [isCopied, setIsCopied] = React.useState(false);
    const ticketLinkRef = React.useRef<HTMLInputElement>(null);

     React.useEffect(() => {
        if (user) {
            const fetchUserProfile = async () => {
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);
            };
            fetchUserProfile();
        }
    }, [user]);

    const handleDeleteTicket = async (ticketId: string, holderName: string) => {
        try {
            await deleteTicket(ticketId);
            toast({
                title: "Participant Deleted",
                description: `${holderName}'s ticket has been successfully deleted.`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: "Could not delete the participant. Please try again.",
            });
        }
    };
    
    const handleViewClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setShowViewDialog(true);
    };

    const handleShareClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsCopied(false);
        setShowShareDialog(true);
    };
    
    const handleCopyLink = () => {
        if (ticketLinkRef.current) {
            navigator.clipboard.writeText(ticketLinkRef.current.value).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
            });
        }
    };
    
    const handleDownloadClick = async (ticketToDownload: Ticket) => {
        if (!ticketToDownload || !event) {
            toast({ variant: "destructive", title: "Download Failed", description: "Ticket or event data is missing." });
            return;
        }
    
        // Create a hidden container to render the ticket
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);
    
        const ticketRef = React.createRef<HTMLDivElement>();
    
        // Render ticket into container
        const root = createRoot(container);
        root.render(<DownloadableTicket ticket={ticketToDownload} event={event} ref={ticketRef} />);
    
        try {
            // Wait for fonts to load
            await document.fonts.ready;
    
            // Wait extra time for images to load
            await new Promise(resolve => setTimeout(resolve, 500));
    
            if (!ticketRef.current) throw new Error("Ticket element is not available for download");
            
            // Fetch font CSS as text to avoid CORS issue
            const fontCss = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap').then(res => res.text());

            // Generate PNG
            const dataUrl = await toPng(ticketRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                fontEmbedCSS: fontCss,
            });
    
            // Trigger download
            const link = document.createElement('a');
            link.download = `ticket-${ticketToDownload.holderName.replace(/\s/g, '_')}-${ticketToDownload.id}.png`;
            link.href = dataUrl;
            link.click();
    
            toast({ title: "Ticket Downloaded", description: `${ticketToDownload.holderName}'s ticket downloaded successfully.` });
    
        } catch (error) {
            console.error("Error generating image:", error);
            toast({ variant: "destructive", title: "Download Failed", description: "Could not generate ticket image." });
        } finally {
            // Cleanup
            root.unmount();
            if (document.body.contains(container)) document.body.removeChild(container);
        }
    };
    

    const handleDirectDownload = (ticket: Ticket) => {
        handleDownloadClick(ticket);
    };

    const currentPlan = userProfile?.planId ? PLANS[userProfile.planId] : PLANS['hobby'];
    const ticketsTotal = currentPlan.limits.maxTicketsPerEvent;
    const canCreateTicket = isFinite(ticketsTotal) ? (event?.ticketsIssued || 0) < ticketsTotal : true;
    const ticketProgress = event && isFinite(ticketsTotal) ? (event.ticketsIssued / ticketsTotal) * 100 : 0;

    const ticketUrl = selectedTicket && typeof window !== 'undefined' 
        ? `${window.location.origin}/ticket/${selectedTicket.id}?eventId=${selectedTicket.eventId}` 
        : '';

    if (eventsLoading || ticketsLoading) {
        return <div>Loading event data...</div>
    }

    if (!event) {
        return <div>Event not found.</div>
    }
    
    const grossRevenue = (event.price || 0) * (event.ticketsIssued || 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">{event.name}</h1>
                    <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Ticket Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{event.ticketsIssued} / {isFinite(ticketsTotal) ? ticketsTotal : '∞'}</div>
                        <p className="text-xs text-muted-foreground">{isFinite(ticketProgress) ? `${ticketProgress.toFixed(0)}% sold` : ''}</p>
                        <Progress value={ticketProgress} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Gross Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEventPrice({ price: grossRevenue, currency: event.currency })}</div>
                        <p className="text-xs text-muted-foreground">from {event.ticketsIssued} tickets</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Download Reports</CardTitle>
                    </CardHeader>
                     <CardContent className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="justify-start">
                            <FileDown className="mr-2 h-4 w-4"/> Attendance Log
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start">
                            <FileDown className="mr-2 h-4 w-4"/> Benefits Report
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Participant Management</CardTitle>
                    <CardDescription>A list of all participants for this event.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Upload CSV</Button>
                        <Button size="sm" asChild className="bg-accent text-accent-foreground hover:bg-accent/hinherit" disabled={!canCreateTicket}><Link href={`/dashboard/designer?eventId=${event.id}`}><PlusCircle className="mr-2 h-4 w-4" /> Add Participant</Link></Button>
                        <Button variant="outline" size="sm" asChild><Link href={`/verify?eventId=${event.id}`}><QrCode className="mr-2 h-4 w-4" /> Scan Tickets</Link></Button>
                    </div>
                     {!canCreateTicket && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Ticket Limit Reached</AlertTitle>
                            <AlertDescription>
                                You have reached the maximum number of tickets for this event under the {currentPlan.name} plan. Please <Link href="/pricing" className="underline font-semibold">upgrade your plan</Link> to add more participants.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Name</TableHead>
                                    <TableHead className="hidden sm:table-cell">Ticket Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.length > 0 ? tickets.map(ticket => {
                                    const benefitsUsed = ticket.benefits.filter(b => b.used).length;
                                    return (
                                    <TableRow key={ticket.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={ticket.holderPhotoUrl} alt={ticket.holderName} data-ai-hint="person face" />
                                                    <AvatarFallback>{ticket.holderName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{ticket.holderName}</div>
                                                    <div className="text-sm text-muted-foreground truncate max-w-[150px]">{ticket.holderEmail}</div>
                                                    <div className="sm:hidden mt-1">
                                                        <Badge variant="secondary">{ticket.ticketType}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex flex-col">
                                                <Badge variant="secondary">{ticket.ticketType}</Badge>
                                                <span className="text-xs text-muted-foreground mt-1">
                                                    {benefitsUsed}/{ticket.benefits.length} B. Used
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <TooltipProvider>
                                                <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleViewClick(ticket)}><Eye className="h-4 w-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>View Ticket</p></TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleShareClick(ticket)}><Send className="h-4 w-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Share Ticket</p></TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDirectDownload(ticket)}><FileDown className="h-4 w-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Download Ticket</p></TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <Link href={`/dashboard/designer?eventId=${ticket.eventId}&ticketId=${ticket.id}`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Edit Participant</p></TooltipContent>
                                                    </Tooltip>
                                                    <AlertDialog>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Delete Participant</p></TooltipContent>
                                                        </Tooltip>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete the ticket for {ticket.holderName}. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteTicket(ticket.id, ticket.holderName)}
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                )}) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No participants yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

             {/* View Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent showCloseButton={false} className="sm:max-w-fit p-0 bg-transparent border-0 shadow-none flex items-start gap-2 justify-center">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Ticket Preview for {selectedTicket?.holderName}</DialogTitle>
                        <DialogDescription className="sr-only">A preview of the generated ticket.</DialogDescription>
                    </DialogHeader>
                    {selectedTicket && event && (
                        <TicketPreview ticket={selectedTicket} event={event} />
                    )}
                     {selectedTicket && (
                         <TooltipProvider>
                            <div className="flex flex-col gap-2 p-2 bg-card rounded-lg border shadow-md">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleDownloadClick(selectedTicket)}><FileDown/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Download PNG</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => {setShowViewDialog(false); handleShareClick(selectedTicket);}}><Send/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Share</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => setShowViewDialog(false)}><X/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Close</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    )}
                </DialogContent>
            </Dialog>

            {/* Share Dialog */}
             <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>Share Ticket</DialogTitle>
                    <DialogDescription>
                        Anyone with this link will be able to view and verify this ticket.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                            Link
                            </Label>
                            <Input
                            id="link"
                            defaultValue={ticketUrl}
                            readOnly
                            ref={ticketLinkRef}
                            />
                        </div>
                        <Button type="button" size="icon" className="px-3" onClick={handleCopyLink}>
                            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="sr-only">Copy</span>
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button type="button" variant="secondary" onClick={() => setShowShareDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
