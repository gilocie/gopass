

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, limit, getDoc, deleteDoc } from 'firebase/firestore';
import type { OmitIdOrganizer, Organizer } from '@/lib/types';

const organizersCollection = collection(db, 'organizers');

// Create a new organizer profile
export const createOrganizer = async (organizer: Omit<Organizer, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(organizersCollection, organizer);
        return docRef.id;
    } catch (error) {
        console.error("Error adding organizer document: ", error);
        throw new Error("Could not create organizer profile");
    }
};

// Get all organizer profiles for a specific User ID
export const getOrganizersByUserId = async (userId: string): Promise<Organizer[]> => {
    if (!userId) {
        return [];
    }
    try {
        const q = query(organizersCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organizer));
    } catch (error) {
        console.error("Error getting organizer documents by user ID: ", error);
        throw new Error("Could not get organizer profiles");
    }
};

// Get an organizer profile by its document ID
export const getOrganizerById = async (organizerId: string): Promise<Organizer | null> => {
    try {
        const orgDoc = doc(db, 'organizers', organizerId);
        const docSnap = await getDoc(orgDoc);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Organizer;
        }
        return null;
    } catch (error) {
        console.error("Error getting organizer document by ID:", error);
        throw new Error("Could not get organizer profile");
    }
};

// Get a single organizer profile for a user
export const getOrganizerByUserId = async (userId: string): Promise<Organizer | null> => {
    if (!userId) return null;
    try {
        const q = query(organizersCollection, where("userId", "==", userId), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Organizer;
        }
        return null;
    } catch (error) {
        console.error("Error getting organizer by user ID: ", error);
        throw new Error("Could not get organizer profile");
    }
}

// Update an organizer profile
export const updateOrganizer = async (organizerId: string, data: Partial<Omit<Organizer, 'id' | 'userId'>>) => {
    try {
        const orgDoc = doc(db, 'organizers', organizerId);
        await updateDoc(orgDoc, data);
    } catch (error) {
        console.error("Error updating organizer document:", error);
        throw new Error("Could not update organizer profile");
    }
};

// Delete an organizer profile
export const deleteOrganizer = async (organizerId: string): Promise<void> => {
    try {
        const orgDoc = doc(db, 'organizers', organizerId);
        await deleteDoc(orgDoc);
    } catch (error) {
        console.error("Error deleting organizer document:", error);
        throw new Error("Could not delete organizer profile");
    }
};
