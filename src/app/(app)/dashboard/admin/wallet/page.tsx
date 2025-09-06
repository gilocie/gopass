
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { PayoutRequest, Organizer } from '@/lib/types';
import { getAllPayoutRequests, processPayoutRequest } from '@/services/userService';
import { getOrganizerById } from '@/services/organizerService';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface PayoutRequestWithOrganizer extends PayoutRequest {
    organizer?: Organizer;
}

function PayoutsTab() {
    const { toast } = useToast();
    const { format: formatPrice } = useCurrency();
    const [requests, setRequests] = React.useState<PayoutRequestWithOrganizer[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [processingId, setProcessingId] = React.useState<string | null>(null);
    const [filter, setFilter] = React.useState<'pending' | 'approved' | 'denied'>('pending');

    React.useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const allRequests = await getAllPayoutRequests();
                const requestsWithDetails = await Promise.all(
                    allRequests.map(async (req) => {
                        const organizer = await getOrganizerById(req.organizerId);
                        return { ...req, organizer };
                    })
                );
                setRequests(requestsWithDetails);
            } catch (error) {
                console.error("Failed to fetch payout requests:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch payout requests.' });
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [toast]);

    const handleProcessRequest = async (requestId: string, newStatus: 'approved' | 'denied') => {
        setProcessingId(requestId);
        try {
            await processPayoutRequest(requestId, newStatus);
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
            toast({ title: 'Success', description: `Request has been ${newStatus}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to process the request.' });
        } finally {
            setProcessingId(null);
        }
    };
    
    const filteredRequests = requests.filter(req => req.status === filter);

    if (loading) {
        return <div>Loading payout requests...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Payouts</CardTitle>
                <CardDescription>Review, approve, and deny withdrawal requests from event organizers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="denied">Denied</TabsTrigger>
                    </TabsList>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organizer</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="hidden md:table-cell">Payment Details</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.length > 0 ? filteredRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.organizer?.name || 'Unknown'}</TableCell>
                                    <TableCell>{formatPrice(req.amount)}</TableCell>
                                    <TableCell className="hidden md:table-cell text-xs">
                                        {req.organizer?.paymentDetails?.mobileMoney?.phoneNumber ? (
                                            <div><strong>MoMo:</strong> {req.organizer.paymentDetails.mobileMoney.phoneNumber} ({req.organizer.paymentDetails.mobileMoney.provider})</div>
                                        ) : req.organizer?.paymentDetails?.wireTransfer?.accountNumber ? (
                                             <div><strong>Bank:</strong> {req.organizer.paymentDetails.wireTransfer.accountNumber} ({req.organizer.paymentDetails.wireTransfer.bankName})</div>
                                        ) : (
                                            'No details provided'
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{format(req.requestedAt.toDate(), 'PPP')}</TableCell>
                                    <TableCell className="text-right">
                                        {filter === 'pending' ? (
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="text-green-600 hover:text-green-600"
                                                    onClick={() => handleProcessRequest(req.id, 'approved')}
                                                    disabled={processingId === req.id}
                                                >
                                                    {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-600"
                                                    onClick={() => handleProcessRequest(req.id, 'denied')}
                                                    disabled={processingId === req.id}
                                                >
                                                     {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Badge variant={req.status === 'approved' ? 'default' : 'destructive'}>{req.status}</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                        No {filter} requests found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </CardContent>
        </Card>
    );
}

export default function AdminWalletPage() {
    return (
        <div className="grid gap-6">
            <PayoutsTab />
        </div>
    );
}
