
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile, requestPayout } from '@/services/userService';
import type { Event, Ticket, UserProfile } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRealtimeTickets } from '@/services/ticketService';
import { useFirestoreEvents } from '@/hooks/use-firestore-events';
import { BASE_CURRENCY_CODE } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Filter } from 'lucide-react';
import { format as formatDate } from 'date-fns';

export default function WalletPage() {
  const { user } = useAuth();
  const { format, currency } = useCurrency();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { tickets, loading: loadingTickets } = useRealtimeTickets(9999);
  const { events, loading: loadingEvents } = useFirestoreEvents();
  const [isWithdrawing, setIsWithdrawing] = React.useState(false);
  const [withdrawAmount, setWithdrawAmount] = React.useState('');

  React.useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        setLoading(false);
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  const totalRevenue = tickets.reduce((acc, ticket) => acc + (ticket.totalPaid || 0), 0);
  const totalPaidOut = userProfile?.totalPaidOut || 0;
  const currentBalance = totalRevenue - totalPaidOut;

  const handleWithdraw = async () => {
    if (!user) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount to withdraw.' });
        return;
    }
    if (amount > currentBalance) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'You cannot withdraw more than your current balance.' });
        return;
    }
    setIsWithdrawing(true);
    try {
        await requestPayout(user.uid, amount);
        toast({ title: 'Withdrawal Requested', description: 'Your request has been submitted for processing.' });
        // Optimistically update UI
        setUserProfile(prev => prev ? ({ ...prev, totalPaidOut: (prev.totalPaidOut || 0) + amount }) : null);
        setWithdrawAmount('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Withdrawal Failed', description: error.message });
    } finally {
        setIsWithdrawing(false);
    }
  };


  const getEventName = (eventId: string) => {
    return events.find(e => e.id === eventId)?.name || 'Unknown Event';
  };

  const sortedTickets = [...tickets].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">My Wallet</h1>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{format(currentBalance, currency.code !== BASE_CURRENCY_CODE)}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="text-3xl font-bold">{format(totalRevenue, currency.code !== BASE_CURRENCY_CODE)}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Total Paid Out</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{format(totalPaidOut, currency.code !== BASE_CURRENCY_CODE)}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>A complete list of all ticket sales across your events.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-2 mb-4">
                <Input placeholder="Filter by event or name..." className="max-w-xs" />
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                <Button variant="outline" className="ml-auto"><Download className="mr-2 h-4 w-4" /> Export</Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Request Payout</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Request Payout</AlertDialogTitle>
                            <AlertDialogDescription>
                                Enter the amount you wish to withdraw. Funds will be sent to your registered payment method within 3-5 business days.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount ({currency.code})</Label>
                            <Input 
                                id="amount"
                                type="number"
                                placeholder="e.g. 500.00"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                            />
                             <p className="text-xs text-muted-foreground">Available to withdraw: {format(currentBalance, true)}</p>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleWithdraw} disabled={isWithdrawing}>
                                {isWithdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isWithdrawing ? 'Processing...' : 'Submit Request'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {loadingTickets || loadingEvents || loading ? (
                        <TableRow><TableCell colSpan={4} className="text-center">Loading transactions...</TableCell></TableRow>
                    ) : sortedTickets.length > 0 ? (
                        sortedTickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell>
                                    {ticket.createdAt ? formatDate(ticket.createdAt, 'dd MMM, yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell>{getEventName(ticket.eventId)}</TableCell>
                                <TableCell>{ticket.holderName}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {format(ticket.totalPaid || 0, (events.find(e => e.id === ticket.eventId)?.currency || BASE_CURRENCY_CODE) !== BASE_CURRENCY_CODE)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                                No sales transactions yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
