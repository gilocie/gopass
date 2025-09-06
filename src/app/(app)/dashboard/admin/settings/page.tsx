
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AdminSettingsPage() {
    return (
        <div className="grid gap-6">
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
             <div className="flex justify-end">
                <Button>Save Settings</Button>
            </div>
        </div>
    );
}
