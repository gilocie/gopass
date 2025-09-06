
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Users, DollarSign, Activity, Settings as SettingsIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCurrency } from '@/contexts/CurrencyContext';

function OverviewTab() {
    const { format } = useCurrency();
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">125</div>
                    <p className="text-xs text-muted-foreground">+5 since last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{format(1234.56)}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">210</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12.5%</div>
                    <p className="text-xs text-muted-foreground">From 1.2k Clicks</p>
                </CardContent>
            </Card>
        </div>
    );
}

function AffiliatesTab() {
    const { format } = useCurrency();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Affiliates</CardTitle>
                <CardDescription>View, approve, and manage your affiliate partners.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Affiliate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Conversions</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                           <TableCell>
                                <div className="font-medium">John Doe</div>
                                <div className="text-sm text-muted-foreground">john@example.com</div>
                            </TableCell>
                            <TableCell>Approved</TableCell>
                            <TableCell>25</TableCell>
                            <TableCell className="text-right">{format(250.00)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function PayoutsTab() {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Affiliate Payouts</CardTitle>
                <CardDescription>Review and process commission payouts.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Payout management coming soon.</p>
            </CardContent>
        </Card>
    );
}


function SettingsTab() {
     return (
         <Card>
            <CardHeader>
                <CardTitle>Affiliate Program Settings</CardTitle>
                <CardDescription>Configure the rules and rewards for your affiliate program.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="enable-affiliate" className="text-base">Enable Affiliate Program</Label>
                        <p className="text-sm text-muted-foreground">
                           Allow users to sign up as affiliates.
                        </p>
                    </div>
                    <Switch id="enable-affiliate" defaultChecked />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                        <Input id="commission-rate" type="number" defaultValue="10" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cookie-duration">Cookie Duration (days)</Label>
                        <Input id="cookie-duration" type="number" defaultValue="30" />
                    </div>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="auto-approve" className="text-base">Auto-Approve Affiliates</Label>
                        <p className="text-sm text-muted-foreground">
                           Automatically approve new affiliate sign-ups.
                        </p>
                    </div>
                    <Switch id="auto-approve" />
                </div>
            </CardContent>
        </Card>
    );
}


export default function AdminAffiliatesPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Affiliate Program</CardTitle>
                    <CardDescription>Monitor and manage your platform's affiliate marketing program.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
                            <TabsTrigger value="payouts">Payouts</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                           <OverviewTab />
                        </TabsContent>
                        <TabsContent value="affiliates">
                           <AffiliatesTab />
                        </TabsContent>
                         <TabsContent value="payouts">
                           <PayoutsTab />
                        </TabsContent>
                         <TabsContent value="settings">
                           <SettingsTab />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button>Save Affiliate Settings</Button>
            </div>
        </div>
    );
}
