
      'use client';

import * as React from 'react';
import { getBrandingSettings } from '@/services/settingsService';
import type { BrandingSettings } from '@/lib/types';

function hexToHsl(hex: string): string | null {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
}


export function ThemeApplicator() {
    const [style, setStyle] = React.useState('');

    React.useEffect(() => {
        const fetchAndApplyTheme = async () => {
            const settings = await getBrandingSettings();
            if (settings && settings.colors) {
                const { primary, accent, background } = settings.colors;
                const primaryHsl = hexToHsl(primary);
                const accentHsl = hexToHsl(accent);
                const backgroundHsl = hexToHsl(background);

                const newStyle = `
                    :root {
                        ${backgroundHsl ? `--background: ${backgroundHsl};` : ''}
                        ${primaryHsl ? `--primary: ${primaryHsl};` : ''}
                        ${accentHsl ? `--accent: ${accentHsl};` : ''}
                    }
                    .dark {
                        ${backgroundHsl ? `--background: ${backgroundHsl};` : ''}
                        ${primaryHsl ? `--primary: ${primaryHsl};` : ''}
                        ${accentHsl ? `--accent: ${accentHsl};` : ''}
                    }
                `;
                setStyle(newStyle);
            }
        };

        fetchAndApplyTheme();
    }, []);

    return <style>{style}</style>;
}

    