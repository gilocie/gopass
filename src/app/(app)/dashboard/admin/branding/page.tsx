
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Banner } from '@/components/ui/banner';
import { Separator } from '@/components/ui/separator';
import { Palette } from 'lucide-react';

export default function AdminBrandingPage() {
    // In a real app, these values would be fetched from a global settings document in Firestore
    const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Branding & Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of your GoPass platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-medium text-lg">Site Identity</h3>
                        <div className="grid gap-2">
                            <Label htmlFor="site-name">Site Name</Label>
                            <Input id="site-name" defaultValue="GoPass" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Site Logo</Label>
                            <p className="text-sm text-muted-foreground">Recommended size: 400x100px.</p>
                            <div className="w-full max-w-xs">
                            <Banner initialImage={logoUrl} onImageChange={setLogoUrl} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-medium text-lg flex items-center gap-2"><Palette className="h-5 w-5" /> Color Scheme</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="primary-color">Primary Color</Label>
                                <Input id="primary-color" type="color" defaultValue="#6D28D9" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="accent-color">Accent Color</Label>
                                <Input id="accent-color" type="color" defaultValue="#E11D48" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="background-color">Background Color</Label>
                                <Input id="background-color" type="color" defaultValue="#110d19" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Changes to colors may require a page refresh to take full effect across the application.
                        </p>
                    </div>
                    <Separator />
                    <h3 className="font-medium text-lg">More Coming Soon...</h3>
                    <p className="text-sm text-muted-foreground">
                        Controls for editing the Hero Section, Footer, Contact Details, and more will be added here.
                    </p>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button>Save Branding Settings</Button>
            </div>
        </div>
    );
}
