

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { OmitIdEvent, Event } from '@/lib/types';
import { addNotification } from './notificationService';
import { auth } from '@/lib/firebase';

const eventsCollection = collection(db, 'events');

// Create a new event
export const addEvent = async (event: OmitIdEvent) => {
    try {
        const docRef = await addDoc(eventsCollection, event);
        const user = auth.currentUser;
        if (user) {
            addNotification(user.uid, `New event created: "${event.name}"`, 'event', `/dashboard/events/${docRef.id}`);
        }
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        throw new Error("Could not add event");
    }
};

// Get all events
export const getEvents = async (): Promise<Event[]> => {
    try {
        const querySnapshot = await getDocs(eventsCollection);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
        console.error("Error getting documents: ", error);
        throw new Error("Could not get events");
    }
};

// Get a single event by ID
export const getEventById = async (eventId: string): Promise<Event | null> => {
    try {
        const eventDoc = doc(db, 'events', eventId);
        const docSnap = await getDoc(eventDoc);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Event;
        }
        return null;
    } catch (error) {
        console.error("Error getting document:", error);
        throw new Error("Could not get event");
    }
};

// Update an event
export const updateEvent = async (eventId: string, event: Partial<Omit<Event, 'id'>>) => {
    try {
        const eventDoc = doc(db, 'events', eventId);
        // If we are "deleting", add a timestamp
        if (event.status === 'deleted') {
            await updateDoc(eventDoc, { ...event, deletedAt: serverTimestamp() });
        } else {
            await updateDoc(eventDoc, event);
        }
    } catch (error) {
        console.error("Error updating document:", error);
        throw new Error("Could not update event");
    }
};


// Delete an event - This is now a "soft delete"
export const deleteEvent = async (eventId: string) => {
    try {
        const eventDoc = doc(db, 'events', eventId);
        // Instead of deleting, we update the status to 'deleted'
        await updateDoc(eventDoc, {
            status: 'deleted',
            deletedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error 'deleting' document (archiving): ", error);
        throw new Error("Could not archive event");
    }
};
