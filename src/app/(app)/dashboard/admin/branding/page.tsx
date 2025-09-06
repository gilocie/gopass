
      'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Banner } from '@/components/ui/banner';
import { Palette, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { BrandingSettings } from '@/lib/types';
import { getBrandingSettings, updateBrandingSettings } from '@/services/settingsService';
import { useToast } from '@/hooks/use-toast';

function GeneralTabContent({ settings, setSettings }: { settings: Partial<BrandingSettings>, setSettings: React.Dispatch<React.SetStateAction<Partial<BrandingSettings>>> }) {
    
    const handleColorChange = (key: 'primary' | 'accent' | 'background', value: string) => {
        setSettings(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
    };

    return (
        <div className="space-y-8">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium text-lg">Site Identity</h3>
                <div className="grid gap-2">
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input id="site-name" value={settings.siteName || ''} onChange={(e) => setSettings(prev => ({...prev, siteName: e.target.value}))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Site Logo</Label>
                        <p className="text-sm text-muted-foreground">Recommended size: 400x100px.</p>
                        <div className="w-full max-w-xs">
                            <Banner initialImage={settings.logoUrl} onImageChange={url => setSettings(prev => ({...prev, logoUrl: url}))} />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label>Site Icon (Favicon)</Label>
                        <p className="text-sm text-muted-foreground">Recommended size: 32x32px.</p>
                        <div className="w-full max-w-xs">
                            <Banner initialImage={settings.iconUrl} onImageChange={url => setSettings(prev => ({...prev, iconUrl: url}))} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium text-lg flex items-center gap-2"><Palette className="h-5 w-5" /> Color Scheme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <Input id="primary-color" type="color" value={settings.colors?.primary || '#6D28D9'} onChange={(e) => handleColorChange('primary', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="accent-color">Accent Color</Label>
                        <Input id="accent-color" type="color" value={settings.colors?.accent || '#E11D48'} onChange={(e) => handleColorChange('accent', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="background-color">Background Color</Label>
                        <Input id="background-color" type="color" value={settings.colors?.background || '#110d19'} onChange={(e) => handleColorChange('background', e.target.value)} />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Changes to colors may require a page refresh to take full effect across the application.
                </p>
            </div>
        </div>
    );
}

function HomePageTabContent({ settings, setSettings }: { settings: Partial<BrandingSettings>, setSettings: React.Dispatch<React.SetStateAction<Partial<BrandingSettings>>> }) {
    
    const handleHeroChange = (key: 'title' | 'subtitle', value: string) => {
        setSettings(prev => ({ ...prev, hero: { ...prev.hero, [key]: value } }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Home Page Hero</CardTitle>
                <CardDescription>Customize the main hero section of your public-facing home page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="hero-title">Hero Title</Label>
                    <Input id="hero-title" value={settings.hero?.title || ''} onChange={e => handleHeroChange('title', e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                    <Textarea id="hero-subtitle" value={settings.hero?.subtitle || ''} onChange={e => handleHeroChange('subtitle', e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label>Hero Background Image</Label>
                     <p className="text-sm text-muted-foreground">Recommended size: 1920x1080px.</p>
                    <Banner initialImage={settings.hero?.backgroundImageUrl} onImageChange={url => setSettings(prev => ({...prev, hero: {...prev.hero, backgroundImageUrl: url}}))} />
                </div>
            </CardContent>
        </Card>
    );
}

function FooterTabContent({ settings, setSettings }: { settings: Partial<BrandingSettings>, setSettings: React.Dispatch<React.SetStateAction<Partial<BrandingSettings>>> }) {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>Manage the content and links in your website's footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="copyright-text">Copyright Text</Label>
                    <Input id="copyright-text" value={settings.footer?.copyrightText || ''} onChange={e => setSettings(prev => ({...prev, footer: {...prev.footer, copyrightText: e.target.value}}))} />
                </div>
                <p className="font-medium text-sm">Footer Links coming soon...</p>
            </CardContent>
        </Card>
    );
}

function ContactTabContent({ settings, setSettings }: { settings: Partial<BrandingSettings>, setSettings: React.Dispatch<React.SetStateAction<Partial<BrandingSettings>>> }) {
    const handleContactChange = (key: 'email' | 'phone' | 'address', value: string) => {
        setSettings(prev => ({ ...prev, contact: { ...prev.contact, [key]: value } }));
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Contact Page Details</CardTitle>
                <CardDescription>Update the contact information displayed on your public contact page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input id="contact-email" type="email" value={settings.contact?.email || ''} onChange={e => handleContactChange('email', e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="contact-phone">Contact Phone</Label>
                    <Input id="contact-phone" type="tel" value={settings.contact?.phone || ''} onChange={e => handleContactChange('phone', e.target.value)} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="contact-address">Address</Label>
                    <Input id="contact-address" value={settings.contact?.address || ''} onChange={e => handleContactChange('address', e.target.value)} />
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
    const { toast } = useToast();
    const [settings, setSettings] = React.useState<Partial<BrandingSettings>>({});
    const [loading, setLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    const defaultSettings: BrandingSettings = {
        siteName: "GoPass",
        logoUrl: null,
        iconUrl: null,
        colors: {
            primary: "#6D28D9",
            accent: "#E11D48",
            background: "#110d19",
        },
        hero: {
            title: "Seamless Events, Secure Access.",
            subtitle: "GoPass is the all-in-one platform for modern event organizers. Create, manage, and verify tickets with unparalleled ease and security.",
            backgroundImageUrl: null
        },
        footer: {
            copyrightText: `© ${new Date().getFullYear()} GoPass. All rights reserved.`
        },
        contact: {
            email: "support@gopass.app",
            phone: "+1 (555) 123-4567",
            address: "123 Event Lane, Celebration City, USA"
        }
    };

    React.useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const fetchedSettings = await getBrandingSettings();
                setSettings(fetchedSettings || defaultSettings);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load branding settings.' });
                setSettings(defaultSettings);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [toast]);
    
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await updateBrandingSettings(settings as BrandingSettings);
            toast({ title: 'Success!', description: 'Branding settings have been saved. Refresh to see all changes.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
        } finally {
            setIsSaving(false);
        }
    }
    
    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Loading branding settings...</div>;
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Branding &amp; Appearance</CardTitle>
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
                            <GeneralTabContent settings={settings} setSettings={setSettings} />
                        </TabsContent>
                        <TabsContent value="home">
                           <HomePageTabContent settings={settings} setSettings={setSettings} />
                        </TabsContent>
                         <TabsContent value="footer">
                           <FooterTabContent settings={settings} setSettings={setSettings} />
                        </TabsContent>
                         <TabsContent value="contact">
                           <ContactTabContent settings={settings} setSettings={setSettings} />
                        </TabsContent>
                         <TabsContent value="typography">
                           <TypographyTabContent />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? 'Saving...' : 'Save Branding Settings'}
                </Button>
            </div>
        </div>
    );
}

    