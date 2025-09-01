
'use client';
import * as React from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, DocumentData, doc, updateDoc, increment, getDocs, getDoc, deleteDoc, orderBy, limit, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';
import type { OmitIdTicket, Ticket } from '@/lib/types';
import { stripUndefined } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

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


// Create a new ticket (used for manual creation and pending online payments)
export const addTicket = async (ticket: Omit<OmitIdTicket, 'pin'>): Promise<{ticketId: string, pin: string}> => {
    try {
        const ticketId = uuidv4().toUpperCase();
        const pin = Math.floor(100000 + Math.random() * 900000).toString();

        const ticketWithDetails: OmitIdTicket = {
            ...ticket,
            pin,
            createdAt: new Date(),
        };

        const ticketDocRef = doc(db, 'tickets', ticketId);
        await setDoc(ticketDocRef, stripUndefined(ticketWithDetails));
        
        // For manually created tickets that are auto-approved, increment the count immediately
        if (ticket.paymentMethod === 'manual' && ticket.paymentStatus === 'completed') {
            const eventDocRef = doc(db, 'events', ticket.eventId);
            await updateDoc(eventDocRef, {
                ticketsIssued: increment(1)
            });
        }
        
        return { ticketId, pin };

    } catch (error) {
        console.error("Error adding ticket document: ", error);
        throw new Error("Could not add ticket");
    }
};

/**
 * Creates the final ticket after a successful payment.
 * This function is called from the server-side callback.
 */
export const createFinalTicket = async (ticketId: string, ticketData: OmitIdTicket) => {
    const ticketDocRef = doc(db, 'tickets', ticketId);
    
    const docSnap = await getDoc(ticketDocRef);
    if (docSnap.exists() && docSnap.data().paymentStatus === 'completed') {
        console.log(`Ticket ${ticketId} already marked as completed. Skipping.`);
        return;
    }

    const finalTicketData = {
        ...ticketData,
        id: ticketId,
        paymentStatus: 'completed',
        createdAt: serverTimestamp(),
    };

    await setDoc(ticketDocRef, stripUndefined(finalTicketData), { merge: true });

    const eventDocRef = doc(db, 'events', ticketData.eventId);
    await updateDoc(eventDocRef, {
        ticketsIssued: increment(1)
    });
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
                createdAt: toDate(data.createdAt) ?? new Date() 
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
                createdAt: toDate(data.createdAt) ?? new Date()
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
                createdAt: toDate(data.createdAt) ?? new Date()
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
        await updateDoc(ticketDoc, stripUndefined(ticket));
    } catch (error) {
        console.error("Error updating ticket document:", error);
        throw new Error("Could not update ticket");
    }
};

// Attendee marks their manual payment as complete
export const markTicketAsPaid = async (ticketId: string, receiptUrl: string) => {
    try {
        const ticketDoc = doc(db, 'tickets', ticketId);
        const updateData: { paymentStatus: string; receiptUrl?: string } = {
            paymentStatus: 'awaiting-confirmation',
        };
        if (receiptUrl) {
            updateData.receiptUrl = receiptUrl;
        }
        await updateDoc(ticketDoc, stripUndefined(updateData));
    } catch (error) {
        console.error("Error marking ticket as paid:", error);
        throw new Error("Could not update payment status.");
    }
};

// Organizer confirms a manual payment
export const confirmTicketPayment = async (ticketId: string) => {
    try {
        const ticketDoc = doc(db, 'tickets', ticketId);
        const ticket = await getTicketById(ticketId);
        if (!ticket) throw new Error("Ticket not found");

        if (ticket.paymentStatus !== 'completed') {
            await updateDoc(ticketDoc, {
                paymentStatus: 'completed',
                status: 'active'
            });
            
            const eventDocRef = doc(db, 'events', ticket.eventId);
            await updateDoc(eventDocRef, {
                ticketsIssued: increment(1)
            });
        }

    } catch (error) {
        console.error("Error confirming ticket payment:", error);
        throw new Error("Could not confirm payment.");
    }
};

// Delete a ticket
export const deleteTicket = async (ticketId: string) => {
    try {
        const ticket = await getTicketById(ticketId);
        if (ticket) {
            const eventDocRef = doc(db, 'events', ticket.eventId);
            const eventDocSnap = await getDoc(eventDocRef);
            
            if (eventDocSnap.exists() && ticket.paymentStatus === 'completed') {
                const currentCount = eventDocSnap.data().ticketsIssued || 0;
                if (currentCount > 0) {
                    await updateDoc(eventDocRef, {
                        ticketsIssued: increment(-1)
                    });
                }
            }
            
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
                    createdAt: toDate(data.createdAt) ?? new Date()
                } as Ticket);
            });
            
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
                    createdAt: toDate(data.createdAt) ?? new Date()
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
