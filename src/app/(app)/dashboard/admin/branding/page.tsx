
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Paintbrush, Pipette } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

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

function HeaderTabContent({ settings, setSettings }: { settings: Partial<BrandingSettings>, setSettings: React.Dispatch<React.SetStateAction<Partial<BrandingSettings>>> }) {
    const handleHeaderChange = (key: keyof BrandingSettings['header'], value: any) => {
        setSettings(prev => ({ ...prev, header: { ...prev.header, [key]: value } }));
    };
     const handleHeaderColorChange = (key: 'gradientStartColor' | 'gradientEndColor' | 'solidBackgroundColor', value: string) => {
        setSettings(prev => ({ ...prev, header: { ...prev.header, [key]: value } }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Header Settings</CardTitle>
                <CardDescription>Customize the appearance and elements of the main site header.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">Header Elements</h3>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="show-logo">Show Logo</Label>
                            <Switch id="show-logo" checked={settings.header?.showLogo ?? true} onCheckedChange={checked => handleHeaderChange('showLogo', checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="show-nav">Show Navigation Links</Label>
                            <Switch id="show-nav" checked={settings.header?.showNav ?? true} onCheckedChange={checked => handleHeaderChange('showNav', checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="show-user">Show User Profile/Login</Label>
                            <Switch id="show-user" checked={settings.header?.showUser ?? true} onCheckedChange={checked => handleHeaderChange('showUser', checked)} />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">Header Background</h3>
                     <div className="grid gap-2">
                        <Label>Background Type</Label>
                        <RadioGroup value={settings.header?.backgroundType || 'solid'} onValueChange={(val) => handleHeaderChange('backgroundType', val as 'solid' | 'gradient')} className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="solid" id="solid" />
                                <Label htmlFor="solid" className="font-normal flex items-center gap-1.5"><Paintbrush className="h-3.5 w-3.5"/> Solid</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="gradient" id="gradient" />
                                <Label htmlFor="gradient" className="font-normal flex items-center gap-1.5"><Pipette className="h-3.5 w-3.5"/> Gradient</Label>
                            </div>
                        </RadioGroup>
                    </div>
                     {settings.header?.backgroundType === 'solid' ? (
                        <div className="grid gap-1.5 animate-in fade-in">
                            <Label htmlFor="solid-bg-color">Background Color</Label>
                            <Input id="solid-bg-color" type="color" value={settings.header?.solidBackgroundColor || '#110d19'} onChange={(e) => handleHeaderColorChange('solidBackgroundColor', e.target.value)} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                            <div className="grid gap-1.5">
                                <Label htmlFor="gradient-start">Start</Label>
                                <Input id="gradient-start" type="color" value={settings.header?.gradientStartColor || '#110d19'} onChange={(e) => handleHeaderColorChange('gradientStartColor', e.target.value)} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="gradient-end">End</Label>
                                <Input id="gradient-end" type="color" value={settings.header?.gradientEndColor || '#2b1f42'} onChange={(e) => handleHeaderColorChange('gradientEndColor', e.target.value)} />
                            </div>
                        </div>
                    )}
                 </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">Background Overlay</h3>
                    <div className="grid gap-2">
                        <Label>Overlay Background Image</Label>
                        <p className="text-sm text-muted-foreground">Optional. Recommended size: 1920x100px.</p>
                        <Banner initialImage={settings.header?.backgroundImageUrl} onImageChange={url => handleHeaderChange('backgroundImageUrl', url)} />
                    </div>
                    {settings.header?.backgroundImageUrl && (
                        <div className="grid gap-1.5 mt-2">
                            <Label>Image Opacity</Label>
                            <Slider defaultValue={[settings.header?.backgroundOpacity ?? 10]} max={100} step={1} onValueChange={(value) => handleHeaderChange('backgroundOpacity', value[0])}/>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
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

function TypographyTabContent({ settings, setSettings }: { settings: Partial<BrandingSettings>, setSettings: React.Dispatch<React.SetStateAction<Partial<BrandingSettings>>> }) {
    const handleTypographyChange = (key: keyof NonNullable<BrandingSettings['typography']>, value: string) => {
        setSettings(prev => ({ ...prev, typography: { ...prev.typography, [key]: value } }));
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Typography & Styling</CardTitle>
                <CardDescription>Manage fonts and advanced color styles used across your site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">Header Navigation Links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="link-color">Default Color</Label>
                            <Input id="link-color" type="color" value={settings.typography?.headerLinkColor || '#FFFFFF'} onChange={(e) => handleTypographyChange('headerLinkColor', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="link-hover-color">Hover Color</Label>
                            <Input id="link-hover-color" type="color" value={settings.typography?.headerLinkHoverColor || '#E11D48'} onChange={(e) => handleTypographyChange('headerLinkHoverColor', e.target.value)} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="link-active-color">Active Color</Label>
                            <Input id="link-active-color" type="color" value={settings.typography?.headerLinkActiveColor || '#6D28D9'} onChange={(e) => handleTypographyChange('headerLinkActiveColor', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">Mobile Menu Styling</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="mobile-bg">Background Color</Label>
                            <Input id="mobile-bg" type="color" value={settings.typography?.mobileMenuBackgroundColor || '#110d19'} onChange={(e) => handleTypographyChange('mobileMenuBackgroundColor', e.target.value)} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="mobile-text">Text Color</Label>
                            <Input id="mobile-text" type="color" value={settings.typography?.mobileMenuTextColor || '#FFFFFF'} onChange={(e) => handleTypographyChange('mobileMenuTextColor', e.target.value)} />
                        </div>
                    </div>
                </div>

                <p className="text-muted-foreground text-sm">More font and text style options are coming soon.</p>

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
        header: {
            showLogo: true,
            showNav: true,
            showUser: true,
            backgroundType: 'solid',
            solidBackgroundColor: '#110d19',
            gradientStartColor: '#110d19',
            gradientEndColor: '#2b1f42',
            backgroundImageUrl: null,
            backgroundOpacity: 10,
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
        },
        typography: {
            headerLinkColor: '#FFFFFF',
            headerLinkHoverColor: '#E11D48',
            headerLinkActiveColor: '#6D28D9',
            mobileMenuBackgroundColor: '#110d19',
            mobileMenuTextColor: '#FFFFFF',
        }
    };

    React.useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const fetchedSettings = await getBrandingSettings();
                // Deep merge fetched settings with defaults to ensure new properties are present
                const mergedSettings = {
                    ...defaultSettings,
                    ...fetchedSettings,
                    colors: { ...defaultSettings.colors, ...fetchedSettings?.colors },
                    header: { ...defaultSettings.header, ...fetchedSettings?.header },
                    hero: { ...defaultSettings.hero, ...fetchedSettings?.hero },
                    footer: { ...defaultSettings.footer, ...fetchedSettings?.footer },
                    contact: { ...defaultSettings.contact, ...fetchedSettings?.contact },
                    typography: { ...defaultSettings.typography, ...fetchedSettings?.typography },
                };
                setSettings(mergedSettings);
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
                        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="header">Header</TabsTrigger>
                            <TabsTrigger value="home">Home Page</TabsTrigger>
                            <TabsTrigger value="footer">Footer</TabsTrigger>
                            <TabsTrigger value="contact">Contact</TabsTrigger>
                            <TabsTrigger value="typography">Typography</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <GeneralTabContent settings={settings} setSettings={setSettings} />
                        </TabsContent>
                        <TabsContent value="header">
                           <HeaderTabContent settings={settings} setSettings={setSettings} />
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
                           <TypographyTabContent settings={settings} setSettings={setSettings}/>
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
