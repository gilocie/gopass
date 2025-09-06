
'use client';

import * as React from 'react';
import { getBrandingSettings } from '@/services/settingsService';
import type { BrandingSettings } from '@/lib/types';
import Logo from './logo';

export function LandingFooter() {
    const [settings, setSettings] = React.useState<BrandingSettings | null>(null);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const fetchedSettings = await getBrandingSettings();
                setSettings(fetchedSettings);
            } catch (error) {
                console.error("Failed to load branding settings for footer", error);
            }
        };
        fetchSettings();
    }, []);

    const copyrightText = settings?.footer?.copyrightText || `© ${new Date().getFullYear()} GoPass. All rights reserved.`;
    const siteName = settings?.siteName;
    const logoUrl = settings?.logoUrl;

    return (
        <footer className="bg-muted/50 border-t">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between">
                <Logo siteName={siteName} logoUrl={logoUrl} />
                <p className="text-sm text-muted-foreground mt-4 sm:mt-0">
                    {copyrightText}
                </p>
            </div>
        </footer>
    );
}
