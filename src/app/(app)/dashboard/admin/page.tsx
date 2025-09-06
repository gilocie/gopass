
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Building } from 'lucide-react';
import { getAllUserProfiles } from '@/services/userService';
import { getEvents } from '@/services/eventService';
import { getOrganizersByUserId } from '@/services/organizerService'; // This needs to be adapted
import type { UserProfile, Event, Organizer } from '@/lib/types';
import { format } from 'date-fns';
import { PLANS } from '@/lib/plans';

// In a real app, we'd need a more efficient way to get all organizers
async function getAllOrganizers(users: UserProfile[]): Promise<Organizer[]> {
    const organizerPromises = users.map(user => getOrganizersByUserId(user.uid));
    const organizerArrays = await Promise.all(organizerPromises);
    return organizerArrays.flat();
}


export default function AdminDashboardPage() {
    const [stats, setStats] = React.useState({ users: 0, events: 0, organizers: 0 });
    const [recentUsers, setRecentUsers] = React.useState<UserProfile[]>([]);
    const [recentEvents, setRecentEvents] = React.useState<Event[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [allUsers, events] = await Promise.all([
                    getAllUserProfiles(),
                    getEvents()
                ]);

                // Ensure users are unique to prevent React key errors
                const uniqueUsersMap = new Map<string, UserProfile>();
                allUsers.forEach(user => {
                    if (user && user.uid) {
                        uniqueUsersMap.set(user.uid, user);
                    }
                });
                const users = Array.from(uniqueUsersMap.values());

                const organizers = await getAllOrganizers(users);
                
                // Sort users by created date if available, otherwise just slice
                const sortedUsers = users; // Firestore doesn't give us a reliable created date on the user object itself
                
                const sortedEvents = events
                    .filter(e => e.createdAt)
                    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));

                setStats({ users: users.length, events: events.length, organizers: organizers.length });
                setRecentUsers(sortedUsers.slice(0, 5));
                setRecentEvents(sortedEvents.slice(0, 5));

            } catch (error) {
                console.error("Failed to fetch admin dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div>Loading admin dashboard...</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Platform Overview</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.users}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.events}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Organizers</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.organizers}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event Name</TableHead>
                                    <TableHead className="hidden md:table-cell">Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentEvents.map(event => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <div className="font-medium">{event.name}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline">{event.status}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {event.createdAt ? format(event.createdAt.toDate(), 'PPP') : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>New Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentUsers.map(user => (
                                <div key={user.uid} className="flex items-center gap-4">
                                    <div className="grid gap-1 text-sm">
                                        <p className="font-medium leading-none">{user.displayName || 'Unnamed User'}</p>
                                        <p className="text-muted-foreground">{user.email}</p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        <Badge variant="secondary">{PLANS[user.planId].name}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
