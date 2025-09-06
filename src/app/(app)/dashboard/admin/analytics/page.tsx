
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Ticket, Users } from 'lucide-react';
import type { Event, Ticket as TicketType } from '@/lib/types';
import { getEvents } from '@/services/eventService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { BASE_CURRENCY_CODE } from '@/lib/currency';

// In a real app, this would be in a service file
async function getAllTickets(): Promise<TicketType[]> {
    const ticketsCollection = collection(db, 'tickets');
    const querySnapshot = await getDocs(ticketsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketType));
}


export default function AdminAnalyticsPage() {
    const [events, setEvents] = React.useState<Event[]>([]);
    const [tickets, setTickets] = React.useState<TicketType[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { format: formatPrice, convert, currency: userCurrency, exchangeRates } = useCurrency();

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [allEvents, allTickets] = await Promise.all([
                    getEvents(),
                    getAllTickets()
                ]);
                setEvents(allEvents);
                setTickets(allTickets);
            } catch (error) {
                console.error("Failed to fetch analytics data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalRevenueInBaseCurrency = React.useMemo(() => {
        return tickets.reduce((acc, ticket) => {
            const event = events.find(e => e.id === ticket.eventId);
            const ticketCurrency = event?.currency || BASE_CURRENCY_CODE;
            const amount = ticket.totalPaid || 0;

            if (ticketCurrency === BASE_CURRENCY_CODE) {
                return acc + amount;
            }
            
            // Convert local currency amount back to base currency for consistent summation
            const rate = exchangeRates[ticketCurrency] || 1;
            return acc + (amount / rate);
        }, 0);
    }, [tickets, events, exchangeRates]);

    const totalTicketsSold = tickets.length;
    const avgRevenuePerTicket = totalTicketsSold > 0 ? totalRevenueInBaseCurrency / totalTicketsSold : 0;

    const revenueByDay = React.useMemo(() => {
        const data: { [key: string]: number } = {};
        const thirtyDaysAgo = subDays(new Date(), 30);

        for (let i = 0; i <= 30; i++) {
            const date = format(subDays(new Date(), i), 'MMM dd');
            data[date] = 0;
        }

        tickets.forEach(ticket => {
            if (ticket.createdAt && new Date(ticket.createdAt) >= thirtyDaysAgo) {
                const date = format(new Date(ticket.createdAt), 'MMM dd');
                if (data[date] !== undefined) {
                    const event = events.find(e => e.id === ticket.eventId);
                    const ticketCurrency = event?.currency || BASE_CURRENCY_CODE;
                    let amountInBase = ticket.totalPaid || 0;

                    if(ticketCurrency !== BASE_CURRENCY_CODE) {
                        const rate = exchangeRates[ticketCurrency] || 1;
                        amountInBase = amountInBase / rate;
                    }

                    data[date] += amountInBase;
                }
            }
        });
        
        return Object.entries(data).map(([name, revenue]) => ({ name, revenue })).reverse();

    }, [tickets, events, exchangeRates]);
    
    const topEvents = React.useMemo(() => {
        const eventRevenue: { [key: string]: { name: string; revenue: number; tickets: number, currency: string } } = {};
        
        tickets.forEach(ticket => {
            const event = events.find(e => e.id === ticket.eventId);
            if (event) {
                if (!eventRevenue[event.id]) {
                    eventRevenue[event.id] = { name: event.name, revenue: 0, tickets: 0, currency: event.currency || BASE_CURRENCY_CODE };
                }
                eventRevenue[event.id].revenue += ticket.totalPaid || 0;
                eventRevenue[event.id].tickets += 1;
            }
        });

        return Object.values(eventRevenue).sort((a, b) => {
            // Convert to base currency for accurate sorting
            const rateA = a.currency === BASE_CURRENCY_CODE ? 1 : (1 / (exchangeRates[a.currency] || 1));
            const rateB = b.currency === BASE_CURRENCY_CODE ? 1 : (1 / (exchangeRates[b.currency] || 1));
            return (b.revenue * rateB) - (a.revenue * rateA);
        }).slice(0, 5);
    }, [tickets, events, exchangeRates]);


    if (loading) {
        return <div>Loading analytics...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Financial Analytics</h1>
            </div>
             <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(totalRevenueInBaseCurrency)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTicketsSold}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Revenue / Ticket</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(avgRevenuePerTicket)}</div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Revenue - Last 30 Days</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={revenueByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => formatPrice(value, false, true)} />
                            <Tooltip formatter={(value: number) => formatPrice(value)} />
                            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Top Performing Events</CardTitle>
                    <CardDescription>
                        Top 5 events by total revenue generated.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead className="text-right">Tickets Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topEvents.map((event) => (
                                <TableRow key={event.name}>
                                    <TableCell>
                                        <div className="font-medium">{event.name}</div>
                                    </TableCell>
                                    <TableCell className="text-right">{event.tickets}</TableCell>
                                    <TableCell className="text-right">{formatPrice(event.revenue, true)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
