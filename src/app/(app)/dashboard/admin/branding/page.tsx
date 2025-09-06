
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Banner } from '@/components/ui/banner';
import { Separator } from '@/components/ui/separator';
import { Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

function GeneralTabContent({ 
    logoUrl, 
    setLogoUrl,
    iconUrl,
    setIconUrl,
}: { 
    logoUrl: string | null, 
    setLogoUrl: (url: string | null) => void,
    iconUrl: string | null,
    setIconUrl: (url: string | null) => void 
}) {
    return (
        <div className="space-y-8">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium text-lg">Site Identity</h3>
                <div className="grid gap-2">
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input id="site-name" defaultValue="GoPass" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Site Logo</Label>
                        <p className="text-sm text-muted-foreground">Recommended size: 400x100px.</p>
                        <div className="w-full max-w-xs">
                        <Banner initialImage={logoUrl} onImageChange={setLogoUrl} />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label>Site Icon (Favicon)</Label>
                        <p className="text-sm text-muted-foreground">Recommended size: 32x32px.</p>
                        <div className="w-full max-w-xs">
                        <Banner initialImage={iconUrl} onImageChange={setIconUrl} />
                        </div>
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
        </div>
    );
}

function HomePageTabContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Home Page Hero</CardTitle>
                <CardDescription>Customize the main hero section of your public-facing home page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="hero-title">Hero Title</Label>
                    <Input id="hero-title" defaultValue="Seamless Events, Secure Access." />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                    <Textarea id="hero-subtitle" defaultValue="GoPass is the all-in-one platform for modern event organizers. Create, manage, and verify tickets with unparalleled ease and security." />
                </div>
                <div className="grid gap-2">
                    <Label>Hero Background Image</Label>
                     <p className="text-sm text-muted-foreground">Recommended size: 1920x1080px.</p>
                    <Banner onImageChange={() => {}} />
                </div>
            </CardContent>
        </Card>
    );
}

function FooterTabContent() {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>Manage the content and links in your website's footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="copyright-text">Copyright Text</Label>
                    <Input id="copyright-text" defaultValue={`© ${new Date().getFullYear()} GoPass. All rights reserved.`} />
                </div>
                <p className="font-medium text-sm">Footer Links coming soon...</p>
            </CardContent>
        </Card>
    );
}

function ContactTabContent() {
     return (
         <Card>
            <CardHeader>
                <CardTitle>Contact Page Details</CardTitle>
                <CardDescription>Update the contact information displayed on your public contact page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input id="contact-email" type="email" defaultValue="support@gopass.app" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="contact-phone">Contact Phone</Label>
                    <Input id="contact-phone" type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="contact-address">Address</Label>
                    <Input id="contact-address" defaultValue="123 Event Lane, Celebration City, USA" />
                </div>
            </CardContent>
        </Card>
    );
}

function TypographyTabContent() {
     return (
         <Card>
            <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Manage the fonts and text styles used across your site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Font selection and styling options coming soon.</p>
            </CardContent>
        </Card>
    );
}


export default function AdminBrandingPage() {
    // In a real app, these values would be fetched from a global settings document in Firestore
    const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
    const [iconUrl, setIconUrl] = React.useState<string | null>(null);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Branding & Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of your GoPass platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="home">Home Page</TabsTrigger>
                            <TabsTrigger value="footer">Footer</TabsTrigger>
                            <TabsTrigger value="contact">Contact Page</TabsTrigger>
                            <TabsTrigger value="typography">Typography</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <GeneralTabContent 
                                logoUrl={logoUrl} 
                                setLogoUrl={setLogoUrl}
                                iconUrl={iconUrl}
                                setIconUrl={setIconUrl}
                            />
                        </TabsContent>
                        <TabsContent value="home">
                           <HomePageTabContent />
                        </TabsContent>
                         <TabsContent value="footer">
                           <FooterTabContent />
                        </TabsContent>
                         <TabsContent value="contact">
                           <ContactTabContent />
                        </TabsContent>
                         <TabsContent value="typography">
                           <TypographyTabContent />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button>Save Branding Settings</Button>
            </div>
        </div>
    );
}
