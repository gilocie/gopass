
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { stripUndefined } from '@/lib/utils';

const getDraftDocRef = (userId: string, draftId: string) => {
    return doc(db, 'users', userId, 'ticketDrafts', draftId);
}

// Save or update a draft
export const saveDraft = async (userId: string, draftId: string, draftData: any) => {
    try {
        const draftDocRef = getDraftDocRef(userId, draftId);
        
        // Firestore does not support `undefined` values.
        // We need to strip them out before saving.
        const cleanedData = stripUndefined(draftData);
        
        await setDoc(draftDocRef, { ...cleanedData, lastSaved: serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error("Error saving draft: ", error);
        throw new Error("Could not save draft");
    }
};

// Get a draft
export const getDraft = async (userId: string, draftId: string): Promise<any | null> => {
    try {
        const draftDocRef = getDraftDocRef(userId, draftId);
        const docSnap = await getDoc(draftDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Ensure lastSaved is a Date object
            if (data.lastSaved instanceof Timestamp) {
                data.lastSaved = data.lastSaved.toDate();
            }
            return data;
        }
        return null;
    } catch (error) {
        console.error("Error getting draft:", error);
        throw new Error("Could not get draft");
    }
};

// Delete a draft
export const deleteDraft = async (userId: string, draftId: string) => {
    try {
        const draftDocRef = getDraftDocRef(userId, draftId);
        await deleteDoc(draftDocRef);
    } catch (error) {
        console.error("Error deleting draft: ", error);
        throw new Error("Could not delete draft");
    }
};
