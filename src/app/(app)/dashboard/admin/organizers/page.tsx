
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import type { Organizer, UserProfile } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAllUserProfiles } from '@/services/userService';

// This function needs to be defined in a service file in a real app
async function getAllOrganizers(): Promise<Organizer[]> {
    const organizersCollection = collection(db, 'organizers');
    const querySnapshot = await getDocs(organizersCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organizer));
}

export default function AdminOrganizersPage() {
    const [organizers, setOrganizers] = React.useState<Organizer[]>([]);
    const [users, setUsers] = React.useState<Map<string, UserProfile>>(new Map());
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [allOrganizers, allUsers] = await Promise.all([
                    getAllOrganizers(),
                    getAllUserProfiles()
                ]);

                const userMap = new Map<string, UserProfile>();
                allUsers.forEach(user => userMap.set(user.uid, user));

                setOrganizers(allOrganizers);
                setUsers(userMap);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getUserEmail = (userId: string) => {
        return users.get(userId)?.email || 'N/A';
    }

    if (loading) {
        return <div>Loading organizers...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Organizers</CardTitle>
                <CardDescription>A list of all organizer pages on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Organizer Name</TableHead>
                            <TableHead className="hidden md:table-cell">Owner Email</TableHead>
                            <TableHead className="hidden md:table-cell">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizers.map(organizer => (
                            <TableRow key={organizer.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarImage src={organizer.logoUrl} alt={organizer.name} />
                                            <AvatarFallback>{organizer.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{organizer.name}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{getUserEmail(organizer.userId)}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <Badge variant={organizer.isActive ? 'default' : 'secondary'}>{organizer.isActive ? 'Active' : 'Inactive'}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>View Page</DropdownMenuItem>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">Suspend Page</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
