
'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadFileFromServer = async (formData: FormData): Promise<string> => {
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file) {
        throw new Error("No file provided for upload.");
    }
    if (!path) {
        throw new Error("No destination path provided for upload.");
    }

    const storageRef = ref(storage, path);
    
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Failed to upload file to storage.");
    }
};
