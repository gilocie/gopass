
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Event } from '@/lib/types';

export function useFirestoreEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData: Event[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        eventsData.push({ id: doc.id, ...doc.data() } as Event);
      });
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { events, loading };
}
