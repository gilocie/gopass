
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Copy, Check, FileDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import type { Event, Ticket, Organizer } from '@/lib/types';
import { getTicketById } from '@/services/ticketService';
import { getEventById } from '@/services/eventService';
import { getOrganizerById } from '@/services/organizerService';
import Image from 'next/image';
import { formatEventPrice, currencies, BASE_CURRENCY_CODE } from '@/lib/currency';
import { renderToStaticMarkup } from 'react-dom/server';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function PurchaseSuccessPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.eventId as string;
    const { toast } = useToast();
    const { format } = useCurrency();

    const [purchaseDetails, setPurchaseDetails] = React.useState<{ticketId: string, pin: string} | null>(null);
    const [isCopied, setIsCopied] = React.useState(false);
    
    const [ticket, setTicket] = React.useState<Ticket | null>(null);
    const [event, setEvent] = React.useState<Event | null>(null);
    const [organizer, setOrganizer] = React.useState<Organizer | null>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const invoiceRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const detailsStr = sessionStorage.getItem('lastPurchaseDetails');
        if (detailsStr) {
            const parsedDetails = JSON.parse(detailsStr);
            if (parsedDetails.eventId === eventId && typeof parsedDetails.ticketId === 'string') {
                const ticketIdStr = String(parsedDetails.ticketId); // Ensure it's a string
                setPurchaseDetails({
                    ...parsedDetails,
                    ticketId: ticketIdStr,
                });
                
                const fetchData = async () => {
                    try {
                        const ticketData = await getTicketById(ticketIdStr);
                        setTicket(ticketData);
                        if (ticketData) {
                            const eventData = await getEventById(ticketData.eventId);
                            setEvent(eventData);
                            if (eventData?.organizerId) {
                                const orgData = await getOrganizerById(eventData.organizerId);
                                setOrganizer(orgData);
                            }
                        } else {
                             toast({ variant: 'destructive', title: 'Error', description: 'Could not find the created ticket.' });
                        }
                    } catch (error) {
                        console.error("Error fetching data:", error);
                        toast({ variant: 'destructive', title: 'Error', description: 'Could not load all invoice data.' });
                    }
                }
                fetchData();

            } else {
                 router.push(`/events/${eventId}`);
            }
        } else {
            router.push(`/events/${eventId}`);
        }
    }, [eventId, router, toast]);

    const handleCopy = () => {
        if (!purchaseDetails) return;
        const textToCopy = `Ticket Link: ${window.location.origin}/ticket/${purchaseDetails.ticketId}?eventId=${eventId}\nPIN: ${purchaseDetails.pin}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            toast({ title: "Copied!", description: "Ticket link and PIN copied to clipboard." });
            setTimeout(() => setIsCopied(false), 3000);
        });
    };
    
   const handleDownloadPdf = async () => {
        if (!invoiceRef.current) {
            toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not find invoice content.' });
            return;
        }
        setIsDownloading(true);
        try {
            const fontCss = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap').then(res => res.text());

            const dataUrl = await toPng(invoiceRef.current, { 
                cacheBust: true, 
                pixelRatio: 2, 
                fontEmbedCSS: fontCss 
            });
            const pdf = new jsPDF('p', 'px', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(dataUrl);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`invoice-${ticket?.id}.pdf`);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Download Failed', description: 'An error occurred while generating the PDF.' });
        } finally {
            setIsDownloading(false);
        }
    };
    
    if (!purchaseDetails) {
        return <div className="flex min-h-screen items-center justify-center">Loading your ticket details...</div>
    }

    const ticketUrl = `/ticket/${purchaseDetails.ticketId}?eventId=${eventId}`;
    const createdAtDate = ticket?.createdAt instanceof Date ? ticket.createdAt : (ticket?.createdAt ? new Date((ticket.createdAt as any).seconds * 1000) : null);
    const isManualPayment = ticket?.paymentMethod === 'manual' && ticket?.paymentStatus !== 'completed';

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Purchase Successful!</CardTitle>
                    <CardDescription>
                        {isManualPayment
                            ? "Your ticket has been reserved. Please complete the payment to activate it."
                            : "Your ticket has been created. Please save the following details in a secure place."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-secondary rounded-md space-y-2 text-left">
                        <div>
                            <p className="text-sm font-semibold">Ticket Link:</p>
                            <p className="font-mono text-xs break-all">{`${window.location.origin}${ticketUrl}`}</p>
                        </div>
                         <div>
                            <p className="text-sm font-semibold">Your 6-Digit PIN:</p>
                            <p className="font-mono text-2xl tracking-widest">{purchaseDetails.pin}</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={handleCopy} className="w-full">
                            {isCopied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                            {isCopied ? 'Copied!' : 'Copy Details'}
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={ticketUrl} target="_blank">View Ticket</Link>
                        </Button>
                         <Button onClick={handleDownloadPdf} disabled={!ticket || !event || isDownloading} className="w-full">
                            {isDownloading ? <Loader2 className="mr-2 animate-spin"/> : <FileDown className="mr-2" />}
                            {isDownloading ? 'Downloading...' : 'Download Invoice'}
                        </Button>
                    </div>
                     <p className="text-xs text-muted-foreground">
                        You will need the PIN to access and view your secure ticket.
                    </p>
                </CardContent>
            </Card>

            {ticket && event && (
                <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
                     <div ref={invoiceRef} className="p-8 bg-white text-black" style={{ width: '210mm', fontFamily: 'Inter, sans-serif' }}>
                        <div className="flex justify-between items-start mb-8 pb-4 border-b-2">
                            <div>
                                {organizer?.logoUrl && <img src={organizer.logoUrl} alt={organizer.name} style={{maxWidth: '120px', maxHeight: '60px'}} className="mb-2" />}
                                <div className="text-2xl font-bold">{organizer?.name || 'GoPass'}</div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold uppercase">Invoice</h2>
                                <p><strong>Invoice #:</strong> <span style={{fontFamily: 'monospace'}}>{ticket.id}</span></p>
                                {createdAtDate && <p><strong>Date:</strong> {createdAtDate.toLocaleDateString()}</p>}
                                <p><strong>Status:</strong> <span className="font-bold">{ticket.paymentStatus === 'completed' ? 'PAID' : 'UNPAID'}</span></p>
                            </div>
                        </div>
                        <div className="mb-8">
                            <h3 className="text-lg font-bold mb-2">Billed To</h3>
                            <p><strong>Name:</strong> {ticket.holderName}</p>
                            <p><strong>Email:</strong> {ticket.holderEmail}</p>
                            {ticket.holderPhone && <p><strong>Phone:</strong> {ticket.holderPhone}</p>}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-2">Order Summary for "{event.name}"</h3>
                            <div className="space-y-2">
                                {ticket.benefits.map(benefit => {
                                    const eventBenefit = event.benefits?.find(b => b.id === benefit.id);
                                    const eventCurrency = currencies[event.currency] || currencies[BASE_CURRENCY_CODE];
                                    return (
                                        <div key={benefit.id} className="flex justify-between py-2 border-b">
                                            <span>{benefit.name}</span>
                                            <span>{formatEventPrice({ price: eventBenefit?.price || 0, currency: event.currency })}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex justify-between font-bold text-2xl border-t-2 border-black pt-4 mt-4">
                                <span>Total Due:</span>
                                <span>{formatEventPrice({ price: ticket.totalPaid || 0, currency: event.currency })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
