
      'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { BrandingSettings } from '@/lib/types';
import { stripUndefined } from '@/lib/utils';

const settingsDocRef = doc(db, 'settings', 'branding');

export const getBrandingSettings = async (): Promise<BrandingSettings | null> => {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as BrandingSettings;
            // Convert Firestore Timestamp to a serializable format (ISO string)
            // This is crucial for passing data from Server Components to Client Components
            if (data.lastUpdated && data.lastUpdated instanceof Timestamp) {
                data.lastUpdated = data.lastUpdated.toDate().toISOString();
            }
            return data;
        }
        return null;
    } catch (error) {
        console.error("Error getting branding settings:", error);
        throw new Error("Could not fetch branding settings.");
    }
};

export const updateBrandingSettings = async (settings: BrandingSettings): Promise<void> => {
    try {
        const cleanedSettings = stripUndefined(settings);
        await setDoc(settingsDocRef, { ...cleanedSettings, lastUpdated: Timestamp.now() }, { merge: true });
    } catch (error) {
        console.error("Error updating branding settings:", error);
        throw new Error("Could not update branding settings.");
    }
};

    