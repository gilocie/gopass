
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { getAllUserProfiles } from '@/services/userService';
import type { UserProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendMassNotification } from '@/ai/flows/send-mass-notification';
import { useCurrency } from '@/contexts/CurrencyContext';

function PlatformSettingsTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Manage global settings for the GoPass platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="maintenance-mode" className="text-base">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                            Temporarily disable access to the public site for maintenance. Admins will still be able to log in.
                        </p>
                    </div>
                    <Switch id="maintenance-mode" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="new-registrations" className="text-base">Enable New Registrations</Label>
                        <p className="text-sm text-muted-foreground">
                            Allow new users to sign up for accounts.
                        </p>
                    </div>
                    <Switch id="new-registrations" defaultChecked />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="event-creation" className="text-base">Enable Event Creation</Label>
                        <p className="text-sm text-muted-foreground">
                            Allow organizers to create new events.
                        </p>
                    </div>
                    <Switch id="event-creation" defaultChecked />
                </div>
            </CardContent>
        </Card>
    );
}

function FeaturesTab() {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Enable or disable specific features across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="online-payment" className="text-base">Online Ticket Payments</Label>
                        <p className="text-sm text-muted-foreground">
                           Allow attendees to pay for tickets online via mobile money.
                        </p>
                    </div>
                    <Switch id="online-payment" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="org-page-creation" className="text-base">Organization Page Creation</Label>
                        <p className="text-sm text-muted-foreground">
                           Allow users to create public-facing organizer pages.
                        </p>
                    </div>
                    <Switch id="org-page-creation" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="ai-description" className="text-base">AI Event Descriptions</Label>
                        <p className="text-sm text-muted-foreground">
                           Enable the AI-powered event description generator.
                        </p>
                    </div>
                    <Switch id="ai-description" defaultChecked />
                </div>
            </CardContent>
        </Card>
    );
}

function PlansTab() {
    const { format } = useCurrency();
    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Subscription Plans</CardTitle>
                        <CardDescription>Manage pricing plans available to users.</CardDescription>
                    </div>
                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Create Plan</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plan Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="hidden md:table-cell">Events Limit</TableHead>
                            <TableHead className="hidden md:table-cell">Tickets/Event</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(PLANS).map(([planId, plan]) => (
                             <TableRow key={planId}>
                                <TableCell>
                                    <div className="font-medium">{plan.name}</div>
                                </TableCell>
                                <TableCell>{format(parseInt(plan.price))}/mo</TableCell>
                                <TableCell className="hidden md:table-cell">{plan.limits.maxEvents}</TableCell>
                                <TableCell className="hidden md:table-cell">{plan.limits.maxTicketsPerEvent}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Edit Plan</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">Delete Plan</DropdownMenuItem>
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

function TeamTab() {
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    
    React.useEffect(() => {
        const fetchUsers = async () => {
            const allUsers = await getAllUserProfiles();
            const uniqueUsersMap = new Map<string, UserProfile>();
            allUsers.forEach(user => {
                if (user && user.uid) {
                    uniqueUsersMap.set(user.uid, user);
                }
            });
            setUsers(Array.from(uniqueUsersMap.values()));
        };
        fetchUsers();
    }, []);

    return (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Team Management</CardTitle>
                        <CardDescription>Invite and manage administrative users.</CardDescription>
                    </div>
                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add User</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {users.map((user) => (
                             <TableRow key={user.uid}>
                                <TableCell>
                                    <div className="font-medium">{user.displayName || 'Unnamed User'}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.isAdmin ? 'default' : 'secondary'}>{user.isAdmin ? 'Admin' : 'Subscriber'}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
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

function PromotionsTab() {
    const { toast } = useToast();
    const [title, setTitle] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [link, setLink] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);

    const handleSend = async () => {
        if (!title || !message) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title and a message.' });
            return;
        }
        setIsSending(true);
        try {
            const result = await sendMassNotification({ title, message, link });
            toast({
                title: 'Notifications Sent!',
                description: `${result.count} users have been notified.`,
            });
            setTitle('');
            setMessage('');
            setLink('');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to Send',
                description: 'An error occurred while sending notifications.',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Marketing & Promotions</CardTitle>
                <CardDescription>Create marketing campaigns and send platform-wide notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="promo-title">Notification Title</Label>
                    <Input id="promo-title" placeholder="e.g., New Feature Alert!" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="promo-message">Message</Label>
                    <Textarea id="promo-message" placeholder="Describe the announcement or promotion..." value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="promo-link">Link (Optional)</Label>
                    <Input id="promo-link" placeholder="/pricing" value={link} onChange={(e) => setLink(e.target.value)} />
                </div>
                 <Button onClick={handleSend} disabled={isSending}>
                    {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSending ? 'Sending...' : 'Send Notification to All Users'}
                </Button>
            </CardContent>
        </Card>
    );
}

function ApiSettingsTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Manage third-party API keys and platform API access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">Google AI</h3>
                    <div className="grid gap-2">
                        <Label htmlFor="gemini-api-key">Gemini API Key</Label>
                        <Input id="gemini-api-key" type="password" placeholder="Enter your Gemini API Key" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This key is used for AI features like event description generation.
                    </p>
                </div>
                <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-lg">PawaPay Credentials</h3>
                         <div className="flex items-center space-x-2">
                            <Label htmlFor="live-mode">Live Mode</Label>
                            <Switch id="live-mode" />
                        </div>
                    </div>
                     <Tabs defaultValue="sandbox">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="sandbox">Sandbox</TabsTrigger>
                            <TabsTrigger value="live">Live</TabsTrigger>
                        </TabsList>
                        <TabsContent value="sandbox" className="mt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="pawapay-sandbox-token">Sandbox API Token</Label>
                                <Input id="pawapay-sandbox-token" type="password" placeholder="Enter your Sandbox Token" />
                            </div>
                        </TabsContent>
                        <TabsContent value="live" className="mt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="pawapay-live-token">Live API Token</Label>
                                <Input id="pawapay-live-token" type="password" placeholder="Enter your Live Token" />
                            </div>
                        </TabsContent>
                    </Tabs>
                    <p className="text-xs text-muted-foreground">
                        Tokens are used for processing online mobile money payments. Keep them secure. Use Sandbox for testing.
                    </p>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="gopass-api" className="text-base">GoPass API Access</Label>
                        <p className="text-sm text-muted-foreground">
                           Enable or disable the ability for users to access GoPass features via an API.
                        </p>
                    </div>
                    <Switch id="gopass-api" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminSettingsPage() {
    return (
        <div className="grid gap-6">
            <Tabs defaultValue="platform" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
                    <TabsTrigger value="platform">Platform</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                </TabsList>
                <TabsContent value="platform">
                    <PlatformSettingsTab />
                </TabsContent>
                 <TabsContent value="features">
                    <FeaturesTab />
                </TabsContent>
                <TabsContent value="plans">
                    <PlansTab />
                </TabsContent>
                 <TabsContent value="team">
                    <TeamTab />
                </TabsContent>
                <TabsContent value="promotions">
                    <PromotionsTab />
                </TabsContent>
                <TabsContent value="api">
                    <ApiSettingsTab />
                </TabsContent>
            </Tabs>

             <div className="flex justify-end">
                <Button>Save Settings</Button>
            </div>
        </div>
    );
}
