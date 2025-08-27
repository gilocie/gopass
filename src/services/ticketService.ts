
'use client';
import * as React from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, DocumentData, doc, updateDoc, increment, getDocs, getDoc, deleteDoc, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { OmitIdTicket, Ticket } from '@/lib/types';
import { stripUndefined } from '@/lib/utils';

const ticketsCollection = collection(db, 'tickets');

// Helper to safely convert Firestore Timestamp to Date
const toDate = (timestamp: Timestamp | Date | undefined): Date | undefined => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    // It might already be a Date object if it came from a previous client-side operation
    if (timestamp instanceof Date) {
        return timestamp;
    }
    return undefined;
};


// Create a new ticket
export const addTicket = async (ticket: OmitIdTicket): Promise<string> => {
    try {
        const ticketWithTimestamp = { ...ticket, createdAt: serverTimestamp() };
        const docRef = await addDoc(ticketsCollection, stripUndefined(ticketWithTimestamp));
        
        // Increment the ticketsIssued count on the event
        const eventDocRef = doc(db, 'events', ticket.eventId);
        await updateDoc(eventDocRef, {
            ticketsIssued: increment(1)
        });
        
        return docRef.id;

    } catch (error) {
        console.error("Error adding ticket document: ", error);
        throw new Error("Could not add ticket");
    }
};

// Get a single ticket by ID
export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
    try {
        const ticketDoc = doc(db, 'tickets', ticketId);
        const docSnap = await getDoc(ticketDoc);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                createdAt: toDate(data.createdAt)
            } as Ticket;
        }
        return null;
    } catch (error) {
        console.error("Error getting ticket document:", error);
        throw new Error("Could not get ticket");
    }
};


// Get all tickets for a specific event
export const getTicketsForEvent = async (eventId: string): Promise<Ticket[]> => {
    try {
        const q = query(ticketsCollection, where("eventId", "==", eventId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                createdAt: toDate(data.createdAt)
            } as Ticket
        });
    } catch (error) {
        console.error("Error getting ticket documents: ", error);
        throw new Error("Could not get tickets for the event");
    }
};

// Get the most recently created ticket for an event
export const getMostRecentTicketForEvent = async (eventId: string): Promise<Ticket | null> => {
    try {
        const q = query(ticketsCollection, where("eventId", "==", eventId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }

        const tickets = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                createdAt: toDate(data.createdAt)
            } as Ticket;
        });

        tickets.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.getTime() : 0;
            const timeB = b.createdAt ? b.createdAt.getTime() : 0;
            return timeB - timeA;
        });

        return tickets[0];
    } catch (error) {
        console.error("Error getting most recent ticket: ", error);
        return null;
    }
};


// Update a ticket
export const updateTicket = async (ticketId: string, ticket: Partial<Omit<Ticket, 'id' | 'eventId'>>) => {
    try {
        const ticketDoc = doc(db, 'tickets', ticketId);
        await updateDoc(ticketDoc, ticket);
    } catch (error) {
        console.error("Error updating ticket document:", error);
        throw new Error("Could not update ticket");
    }
};

// Delete a ticket
export const deleteTicket = async (ticketId: string) => {
    try {
        // First, get the ticket to find the eventId
        const ticket = await getTicketById(ticketId);
        if (ticket) {
            // Check if the event exists before trying to update it
            const eventDocRef = doc(db, 'events', ticket.eventId);
            const eventDocSnap = await getDoc(eventDocRef);
            
            if (eventDocSnap.exists()) {
                // Decrement the ticketsIssued count on the event
                await updateDoc(eventDocRef, {
                    ticketsIssued: increment(-1)
                });
            }
            
             // Then, delete the ticket document
            const ticketDoc = doc(db, 'tickets', ticketId);
            await deleteDoc(ticketDoc);
        } else {
            throw new Error("Ticket not found for deletion");
        }
    } catch (error) {
        console.error("Error deleting ticket document: ", error);
        throw new Error("Could not delete ticket");
    }
};


// Hook to get real-time tickets for a specific event
export function useEventTickets(eventId: string) {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!eventId) {
            setTickets([]);
            setLoading(false);
            return;
        }

        const q = query(ticketsCollection, where("eventId", "==", eventId));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ticketsData: Ticket[] = [];
            querySnapshot.forEach((doc: DocumentData) => {
                 const data = doc.data();
                ticketsData.push({ 
                    id: doc.id, 
                    ...data,
                    createdAt: toDate(data.createdAt)
                } as Ticket);
            });
            
            // Sort client-side to avoid composite index requirement
            ticketsData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
            
            setTickets(ticketsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tickets:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [eventId]);

    return { tickets, loading };
}

// Hook to get the latest tickets across all events
export const useRealtimeTickets = (count: number) => {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const q = query(ticketsCollection, orderBy("createdAt", "desc"), limit(count));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ticketsData: Ticket[] = [];
            querySnapshot.forEach((doc: DocumentData) => {
                const data = doc.data();
                ticketsData.push({ 
                    id: doc.id, 
                    ...data,
                    createdAt: toDate(data.createdAt)
                } as Ticket);
            });
            setTickets(ticketsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching real-time tickets:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [count]);

    return { tickets, loading };
}
